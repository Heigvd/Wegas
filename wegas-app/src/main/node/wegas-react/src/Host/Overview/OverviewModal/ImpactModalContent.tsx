import { css, cx } from '@emotion/css';
import JSONForm from 'jsoninput';
import * as React from 'react';
import { IPlayer } from 'wegas-ts-api';
import { globals } from '../../../Components/Hooks/sandbox';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { TabLayout } from '../../../Components/TabLayout/TabLayout';
import { themeVar, trainerTheme } from '../../../Components/Theme/ThemeVars';
import {
  autoMargin,
  autoScroll,
  expandBoth,
  expandHeight,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
  grow,
  textCenter,
} from '../../../css/classes';
import { asyncRunLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Game } from '../../../data/selectors';
import { parseEvent } from '../../../Editor/Components/EntityEditor';
import { ReparentableRoot } from '../../../Editor/Components/Reparentable';
import { IconComp } from '../../../Editor/Components/Views/FontAwesome';
import { wwarn } from '../../../Helper/wegaslog';
import { tabsLineStyle } from '../../HostLayout';
import { ActionItem } from '../Overview';
import { OverviewTab, overviewTabStyle } from '../OverviewTab';
import { modalButtonsContainer } from './OverviewModal';

const subTitleStyle: string = css({
  marginBlock: '12px',
  fontSize: 'medium',
});

const smartLabels: string = css({
  label: {
    fontSize: '14px',
    fontWeight: 'normal',
    margin: 0,
  },
});

const advancedImpactModalStyle: string = css({
  width: '700px',
  height: '400px',
  maxHeight: '100%',
  overflow: 'auto',
  '.wegas-tree-variable-select__search-container': {
    fontSize: '14px',
    width: '600px',
    minHeight: '4em',
    maxHeight: '12em',
  },
});

const jsonFormStyle: string = css({
  '>div': {
    margin: '0',
  },
});

const errorMessageContainerStyle = css({
  maxWidth: '300px',
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  textAlign: 'center',
  height: 'auto',
  color: themeVar.colors.ErrorColor,
});

const successOverlayStyle = css({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: 'rgba(240, 240, 240, 0.85)',
  color: trainerTheme.values.colors['Primary color'],
  fontSize: '96px',
});

type ImpactResult =
  | { status: 'success' }
  | { status: 'error'; messages: string[] };

interface ImpactScript {
  script: string;
  payload?: UnknownValuesObject;
}

/**
 * Runs the scripts one after the other for a single team.
 * Returns the error messages raised by the server, or undefined if all went well
 */
async function runTeamImpact(
  scripts: ImpactScript[],
  player: Readonly<IPlayer> | undefined,
  team: STeam | undefined,
): Promise<string[] | undefined> {
  const errors: string[] = [];
  for (const { script, payload } of scripts) {
    try {
      const response = await asyncRunLoadedScript(
        Game.selectCurrent().id!,
        script,
        player,
        undefined,
        payload != null ? { team: team?.getEntity(), payload } : undefined,
      );
      if (response.events.length > 0) {
        const exceptionEvent: WegasEvent = {
          ...response.events[0],
          timestamp: new Date().getTime(),
          unread: true,
        };
        errors.push(parseEvent(exceptionEvent).message);
      }
    } catch (e) {
      wwarn(e);
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return errors.length > 0 ? errors : undefined;
}

/**
 * Validates the forms, then runs the impact on every targeted team and
 * exposes the result once all teams are done
 */
function useImpactRunner(
  team: STeam | STeam[] | undefined,
  onExit: () => void,
  refreshOverview: () => void,
) {
  const [running, setRunning] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<ImpactResult>();

  const player = Array.isArray(team)
    ? team.map(t => t?.getPlayers()[0].getEntity())
    : team?.getPlayers()[0].getEntity();

  React.useEffect(() => {
    if (result == null) {
      return;
    }
    // Close the modal after a success, hide the errors otherwise
    const timeout =
      result.status === 'success'
        ? setTimeout(onExit, 2000)
        : setTimeout(() => setResult(undefined), 5000);
    return () => clearTimeout(timeout);
  }, [result, onExit]);

  const apply = React.useCallback(
    (forms: (JSONForm | null)[], scripts: ImpactScript[]) => {
      const nbInvalid = forms.reduce(
        (acc, form) => acc + (form?.validate().length ?? 0),
        0,
      );
      if (nbInvalid > 0) {
        setResult({
          status: 'error',
          messages: ['Some values are invalid, impact not applied'],
        });
        return;
      }

      const targets: [Readonly<IPlayer> | undefined, STeam | undefined][] =
        Array.isArray(team) && Array.isArray(player)
          ? team.map((t, i) => [player[i], t])
          : !Array.isArray(team) && !Array.isArray(player)
          ? [[player, team]]
          : [];

      setResult(undefined);
      setRunning(true);
      Promise.all(targets.map(([p, t]) => runTeamImpact(scripts, p, t))).then(
        teamErrors => {
          setRunning(false);
          refreshOverview();
          const errored = teamErrors.filter(e => e != null) as string[][];
          if (errored.length === 0) {
            setResult({ status: 'success' });
          } else {
            const messages = Array.from(
              new Set(errored.flat().filter(m => m.trim().length > 0)),
            );
            if (Array.isArray(team)) {
              messages.unshift(
                `a problem occurred in ${errored.length} / ${team.length} teams`,
              );
            }
            setResult({ status: 'error', messages });
          }
        },
      );
    },
    [team, player, refreshOverview],
  );

  return { player, running, result, apply };
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
  const [payloads, setPayloads] = React.useState<UnknownValuesObject[]>([]);
  const forms = React.useRef<(JSONForm | null)[]>([]);

  const { player, running, result, apply } = useImpactRunner(
    team,
    onExit,
    refreshOverview,
  );

  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      {result?.status === 'success' && <SuccessOverlay />}
      <div className={cx(flex, flexColumn, grow, autoScroll)}>
        {actions.map(({ schemaFn }, index) => {
          const schema = globals.Function(`return (${schemaFn})()`)();
          return (
            <div
              key={JSON.stringify(schemaFn) + index}
              className={cx(flex, flexColumn, expandHeight)}
            >
              <h3 className={subTitleStyle}>{schema.description}</h3>
              <div className={cx(autoScroll, jsonFormStyle, smartLabels)}>
                <JSONForm
                  ref={form => {
                    forms.current[index] = form;
                  }}
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
            </div>
          );
        })}
      </div>
      {result?.status === 'error' && (
        <DisplayFeedbacks messages={result.messages} />
      )}
      <div className={cx(flex, flexRow, flexDistribute, modalButtonsContainer)}>
        <Button
          disabled={player == null || running}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() =>
            apply(
              forms.current.slice(0, actions.length),
              actions.map(({ doFn }, index) => ({
                script: `(${doFn})(team,payload)`,
                payload: payloads[index] || {},
              })),
            )
          }
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
  const form = React.useRef<JSONForm>(null);

  const { player, running, result, apply } = useImpactRunner(
    team,
    onExit,
    refreshOverview,
  );

  return (
    <div className={cx(flex, flexColumn, grow, advancedImpactModalStyle)}>
      {result?.status === 'success' && <SuccessOverlay />}
      <JSONForm
        ref={form}
        value={{ script }}
        schema={advancedImpactSchema}
        onChange={({ script }) => {
          setScript(script);
        }}
      />
      {result?.status === 'error' && (
        <DisplayFeedbacks messages={result.messages} />
      )}
      <div className={cx(flex, flexRow, flexDistribute, modalButtonsContainer)}>
        <Button
          disabled={player == null || running}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() => apply([form.current], [{ script }])}
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
            general: expandBoth,
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

function SuccessOverlay(): JSX.Element {
  return (
    <div className={successOverlayStyle} title="Impact successfully applied">
      <IconComp icon="check" />
    </div>
  );
}

function DisplayFeedbacks({ messages }: { messages: string[] }): JSX.Element {
  return (
    <div className={errorMessageContainerStyle}>
      {messages.map((msg: string) => {
        return (
          <div key={msg} className={cx(textCenter, autoMargin)}>
            {msg}
          </div>
        );
      })}
    </div>
  );
}
