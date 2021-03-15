import { cx } from 'emotion';
import * as React from 'react';
import { IPlayer } from 'wegas-ts-api';
import { globals } from '../../../Components/Hooks/useScript';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import {
  flex,
  flexColumn,
  flexRow,
  flexDistribute,
} from '../../../css/classes';
import { asyncRunLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Game } from '../../../data/selectors';
import { wwarn } from '../../../Helper/wegaslog';
import { ActionItem } from '../Overview';
import JSONForm from 'jsoninput';
import { modalButtonsContainer } from './OverviewModal';
import { TabLayout } from '../../../Editor/Components/LinearTabLayout/TabLayout';
import { ReparentableRoot } from '../../../Editor/Components/Reparentable';
import { tabsLineStyle } from '../../HostLayout';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';

function recurscript(
  functions: string[],
  payloads: {}[],
  player: Readonly<IPlayer> | undefined,
  team: STeam | undefined,
  onExit: () => void,
  refreshOverview: () => void,
  index: number = 0,
) {
  if (index >= functions.length) {
    refreshOverview();
    onExit();
  } else {
    asyncRunLoadedScript(
      Game.selectCurrent().id!,
      functions[index],
      player,
      undefined,
      {
        team: team?.getEntity(),
        payload: payloads[index],
      },
    ).finally(() => {
      recurscript(
        functions,
        payloads,
        player,
        team,
        onExit,
        refreshOverview,
        index + 1,
      );
    });
  }
}

interface ImpactModalComputedContentProps {
  team?: STeam;
  actions: { doFn: string; schemaFn: string }[];
  onExit: () => void;
  refreshOverview: () => void;
}

export function ImpactModalComputedContent({
  team,
  onExit,
  actions,
  refreshOverview,
}: ImpactModalComputedContentProps) {
  const [payloads, setPayloads] = React.useState<{}[]>([]);

  const player = team?.getPlayers()[0].getEntity();
  const functions = actions.map(({ doFn }) => {
    return `(${doFn})(team,payload)`;
  });

  return (
    <div className={cx(flex, flexColumn)}>
      <div className={cx(flex, flexRow)}>
        {actions.map(({ schemaFn }, index) => {
          const schema = globals.Function(
            'team',
            `return (${schemaFn})()`,
          )(team);
          return (
            <div
              key={JSON.stringify(schemaFn) + index}
              className={cx(flex, flexColumn)}
            >
              <h3>{schema.description}</h3>
              <JSONForm
                value={payloads[index] || {}}
                schema={schema}
                onChange={values =>
                  setPayloads(o => {
                    o[index] = values;
                    return o;
                  })
                }
              />
            </div>
          );
        })}
      </div>
      <div className={cx(flex, flexRow, flexDistribute, modalButtonsContainer)}>
        <Button
          disabled={player == null}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() => {
            recurscript(
              functions,
              payloads,
              player,
              team,
              onExit,
              refreshOverview,
            );
          }}
        />
      </div>
    </div>
  );
}

const advancedImpactSchema = {
  description: 'Advanced impact',
  properties: { script: schemaProps.script({ label: 'Advanced impact' }) },
};

interface ImpactModalAdvancedContentProps {
  team?: STeam;
  onExit: () => void;
  refreshOverview: () => void;
}

export function ImpactModalAdvancedContent({
  team,
  onExit,
  refreshOverview,
}: ImpactModalAdvancedContentProps) {
  const [script, setScript] = React.useState('');

  const player = team?.getPlayers()[0].getEntity();

  return (
    <div className={cx(flex, flexColumn)}>
      <JSONForm
        value={{ script }}
        schema={advancedImpactSchema}
        onChange={({ script }) => {
          setScript(script);
        }}
      />

      <div className={cx(flex, flexRow, flexDistribute, modalButtonsContainer)}>
        <Button
          disabled={player == null}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() => {
            asyncRunLoadedScript(Game.selectCurrent().id!, script, player)
              .catch(wwarn)
              .finally(() => {
                onExit();
                refreshOverview();
              });
          }}
        />
      </div>
    </div>
  );
}

interface ImpactModalContentProps {
  team?: STeam;
  item?: ActionItem;
  onExit: () => void;
  refreshOverview: () => void;
}

export function ImpactModalContent({
  team,
  onExit,
  item,
  refreshOverview,
}: ImpactModalContentProps) {
  if (item?.do == null) {
    return <pre>Function and schema needed for impact</pre>;
  }

  try {
    const { actions, showAdvancedImpact } = JSON.parse(item?.do) as {
      type: string;
      actions: { doFn: string; schemaFn: string }[];
      showAdvancedImpact?: boolean;
    };

    return showAdvancedImpact ? (
      <ReparentableRoot>
        <TabLayout
          components={{
            Impacts: (
              <ImpactModalComputedContent
                team={team}
                actions={actions}
                onExit={onExit}
                refreshOverview={refreshOverview}
              />
            ),
            'Advanced impacts': (
              <ImpactModalAdvancedContent
                team={team}
                onExit={onExit}
                refreshOverview={refreshOverview}
              />
            ),
          }}
          classNames={{
            header: tabsLineStyle,
          }}
          defaultActiveLabel="Impacts"
        />
      </ReparentableRoot>
    ) : (
      <ImpactModalComputedContent
        team={team}
        actions={actions}
        onExit={onExit}
        refreshOverview={refreshOverview}
      />
    );
  } catch (e) {
    wwarn(e);
    return <pre>Only wegas react formatting allowed</pre>;
  }
}
