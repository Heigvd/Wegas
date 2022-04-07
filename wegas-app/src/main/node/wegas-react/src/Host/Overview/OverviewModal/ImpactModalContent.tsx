import { css, cx } from '@emotion/css';
import JSONForm from 'jsoninput';
import * as React from 'react';
import { IPlayer } from 'wegas-ts-api';
import { globals } from '../../../Components/Hooks/useScript';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { TabLayout } from '../../../Components/TabLayout/TabLayout';
import {
  autoScroll,
  expandWidth,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
  grow,
} from '../../../css/classes';
import { asyncRunLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Game } from '../../../data/selectors';
import { ReparentableRoot } from '../../../Editor/Components/Reparentable';
import { wwarn } from '../../../Helper/wegaslog';
import { tabsLineStyle } from '../../HostLayout';
import { ActionItem } from '../Overview';
import { OverviewTab, overviewTabStyle } from '../OverviewTab';
import { modalButtonsContainer } from './OverviewModal';

const impactContainerStyle = css({
  //padding: '10px',
  marginBottom: '20px',
  //boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.1)',
});

function recurscript(
  functions: string[],
  payloads: UknownValuesObject[],
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
  team: STeam | STeam[] | undefined;
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
  const [payloads, setPayloads] = React.useState<UknownValuesObject[]>([]);

  const functions = actions.map(({ doFn }) => {
    return `(${doFn})(team,payload)`;
  });

  const player = Array.isArray(team)
    ? team.map(t => t?.getPlayers()[0].getEntity())
    : team?.getPlayers()[0].getEntity();

  return (
    <div className={cx(flex, flexColumn, expandWidth)}>
      <div className={cx(flex, flexColumn, grow, autoScroll)}>
        {actions.map(({ schemaFn }, index) => {
          const schema = globals.Function(`return (${schemaFn})()`)();
          return (
            <div
              key={JSON.stringify(schemaFn) + index}
              className={cx(flex, flexColumn, impactContainerStyle)}
            >
              <h2>{schema.description}</h2>
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
            if (Array.isArray(team) && Array.isArray(player)) {
              team.map((t, i) => {
                recurscript(
                  functions,
                  payloads,
                  player[i],
                  t,
                  onExit,
                  refreshOverview,
                );
              });
            } else if (!Array.isArray(team) && !Array.isArray(player)) {
              recurscript(
                functions,
                payloads,
                player,
                team,
                onExit,
                refreshOverview,
              );
            }
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
  team: STeam | STeam[] | undefined;
  onExit: () => void;
  refreshOverview: () => void;
}

export function ImpactModalAdvancedContent({
  team,
  onExit,
  refreshOverview,
}: ImpactModalAdvancedContentProps) {
  const [script, setScript] = React.useState('');

  const player = Array.isArray(team)
    ? team.map(t => t?.getPlayers()[0].getEntity())
    : team?.getPlayers()[0].getEntity();

  return (
    <div className={cx(flex, flexColumn, grow)}>
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
            if (Array.isArray(team) && Array.isArray(player)) {
              team.map((_t, i) => {
                asyncRunLoadedScript(
                  Game.selectCurrent().id!,
                  script,
                  player[i],
                )
                  .catch(wwarn)
                  .finally(() => {
                    onExit();
                    refreshOverview();
                  });
              });
            } else if (!Array.isArray(team) && !Array.isArray(player)) {
              asyncRunLoadedScript(Game.selectCurrent().id!, script, player)
                .catch(wwarn)
                .finally(() => {
                  onExit();
                  refreshOverview();
                });
            }
          }}
        />
      </div>
    </div>
  );
}

export interface ImpactModalContentProps {
  team: STeam | STeam[] | undefined;
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
          components={[
            {
              tabId: 'Impacts',
              content: (
                <ImpactModalComputedContent
                  team={team}
                  actions={actions}
                  onExit={onExit}
                  refreshOverview={refreshOverview}
                />
              ),
            },
            {
              tabId: 'Advanced impacts',
              content: (
                <ImpactModalAdvancedContent
                  team={team}
                  onExit={onExit}
                  refreshOverview={refreshOverview}
                />
              ),
            },
          ]}
          classNames={{
            header: tabsLineStyle,
            tabsClassName: overviewTabStyle,
          }}
          CustomTab={OverviewTab}
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
