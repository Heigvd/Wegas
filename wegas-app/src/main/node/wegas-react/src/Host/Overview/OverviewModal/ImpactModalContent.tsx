import { css, cx } from '@emotion/css';
import JSONForm from 'jsoninput';
import * as React from 'react';
import { IPlayer } from 'wegas-ts-api';
import { globals } from '../../../Components/Hooks/sandbox';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { TabLayout } from '../../../Components/TabLayout/TabLayout';
import { themeVar } from '../../../Components/Theme/ThemeVars';
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
  hidden,
  textCenter,
} from '../../../css/classes';
import { asyncRunLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Game } from '../../../data/selectors';
import { parseEvent } from '../../../Editor/Components/EntityEditor';
import { ReparentableRoot } from '../../../Editor/Components/Reparentable';
import { classOrNothing } from '../../../Helper/className';
import { wwarn } from '../../../Helper/wegaslog';
import { tabsLineStyle } from '../../HostLayout';
import { ActionItem } from '../Overview';
import { OverviewTab, overviewTabStyle } from '../OverviewTab';
import { modalButtonsContainer } from './OverviewModal';

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
  opacity: 1,
  transition: 'opacity .5s',
  '&.hidden': {
    opacity: 0,
    height: '0px',
  },
  '&.success': {
    color: themeVar.colors.SuccessColor,
  },
});

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

  const [showResults, setShowResults] = React.useState<boolean>(false);
  const [nbTeamErrored, setNbTeamErrored] = React.useState<number>(0);
  const [feedbacks, setFeedbacks] = React.useState<string[]>([]);

  function resetResults(): void {
    setShowResults(false);
    setNbTeamErrored(0);
    setFeedbacks([]);
  }

  const recursiveScript = React.useCallback(
    (
      functions: string[],
      payloads: UnknownValuesObject[],
      player: Readonly<IPlayer> | undefined,
      team: STeam | undefined,
      onExit: () => void,
      refreshOverview: () => void,
      index: number = 0,
    ) => {
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
        )
          .then(response => {
            if (response.events.length > 0) {
              const exceptionEvent: WegasEvent = {
                ...response.events[0],
                timestamp: new Date().getTime(),
                unread: true,
              };
              setNbTeamErrored(value => value + 1);
              const message = parseEvent(exceptionEvent).message;
              if (message.trim().length > 0) {
                setFeedbacks(feedback => {
                  if (!feedback.includes(message)) {
                    return feedback.concat(message);
                  }
                  return feedback;
                });
              }
              return true;
            }
            return false;
          })
          .then((errorOccurred: boolean) => {
            recursiveScript(
              functions,
              payloads,
              player,
              team,
              errorOccurred ? () => {} : () => setTimeout(onExit, 2000),
              refreshOverview,
              index + 1,
            );
          });
      }
    },
    [],
  );

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      resetResults();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [showResults]);

  const functions = actions.map(({ doFn }) => {
    return `(${doFn})(team,payload)`;
  });

  const player = Array.isArray(team)
    ? team.map(t => t?.getPlayers()[0].getEntity())
    : team?.getPlayers()[0].getEntity();

  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      <div className={cx(flex, flexColumn, grow, autoScroll)}>
        {actions.map(({ schemaFn }, index) => {
          const schema = globals.Function(`return (${schemaFn})()`)();
          return (
            <div
              key={JSON.stringify(schemaFn) + index}
              className={cx(flex, flexColumn, expandHeight)}
            >
              <h2>{schema.description}</h2>
              <div className={cx(autoScroll, jsonFormStyle)}>
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
            </div>
          );
        })}
      </div>
      {showResults && (
        <div
          className={cx(
            errorMessageContainerStyle,
            classOrNothing('success', nbTeamErrored < 1),
          )}
        >
          {nbTeamErrored < 1 && <div>Impact successfully applied</div>}
          {nbTeamErrored > 0 && Array.isArray(team) && (
            <div>{`a problem occurred in ${nbTeamErrored} / ${team.length} teams`}</div>
          )}
          {feedbacks.map((msg: string) => {
            return <div key={msg} className={cx(textCenter, autoMargin)}>{msg}</div>;
          })}
        </div>
      )}
      <div
        className={cx(
          flex,
          flexRow,
          flexDistribute,
          modalButtonsContainer,
          showResults ? hidden : '',
        )}
      >
        <Button
          disabled={player == null}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() => {
            resetResults();
            if (Array.isArray(team) && Array.isArray(player)) {
              team.map((t, i) => {
                recursiveScript(
                  functions,
                  payloads,
                  player[i],
                  t,
                  onExit,
                  refreshOverview,
                );
              });
            } else if (!Array.isArray(team) && !Array.isArray(player)) {
              recursiveScript(
                functions,
                payloads,
                player,
                team,
                onExit,
                refreshOverview,
              );
            }
            setShowResults(true);
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

  const [showResults, setShowResults] = React.useState<boolean>(false);
  const [nbTeamErrored, setNbTeamErrored] = React.useState<number>(0);
  const [feedbacks, setFeedbacks] = React.useState<string[]>([]);

  function resetResults(): void {
    setShowResults(false);
    setNbTeamErrored(0);
    setFeedbacks([]);
  }

  const runScript = React.useCallback(
    (player: Readonly<IPlayer> | undefined) => {
      asyncRunLoadedScript(Game.selectCurrent().id!, script, player)
        .then(response => {
          if (response.events.length > 0) {
            const exceptionEvent: WegasEvent = {
              ...response.events[0],
              timestamp: new Date().getTime(),
              unread: true,
            };
            setNbTeamErrored(value => value + 1);
            const message = parseEvent(exceptionEvent).message;
            if (message.trim().length > 0) {
              setFeedbacks(feedback => {
                if (!feedback.includes(message)) {
                  return feedback.concat(message);
                }
                return feedback;
              });
            }
            return true;
          }
          return false;
        })
        .then((errorOccurred: boolean) => {
          if (!errorOccurred) {
            setTimeout(() => {
              onExit();
              refreshOverview();
            }, 2000);
          }
        });
    },
    [script, onExit, refreshOverview, setNbTeamErrored, setFeedbacks],
  );

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      resetResults();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [showResults]);

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
      {showResults && (
        <div
          className={cx(
            errorMessageContainerStyle,
            classOrNothing('success', nbTeamErrored < 1),
          )}
        >
          {nbTeamErrored < 1 && <div>Impact successfully applied</div>}
          {nbTeamErrored > 0 && Array.isArray(team) && (
            <div>{`a problem occurred in ${nbTeamErrored} / ${team.length} teams`}</div>
          )}
          {feedbacks.map((msg: string) => {
            return <div key={msg} className={cx(textCenter, autoMargin)}>{msg}</div>;
          })}
        </div>
      )}
      <div
        className={cx(
          flex,
          flexRow,
          flexDistribute,
          modalButtonsContainer,
          showResults ? hidden : '',
        )}
      >
        <Button
          disabled={player == null}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() => {
            resetResults();
            if (Array.isArray(team) && Array.isArray(player)) {
              team.map((_t, i) => {
                runScript(player[i]);
              });
            } else if (!Array.isArray(team) && !Array.isArray(player)) {
              runScript(player);
            }
            setShowResults(true);
            refreshOverview();
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
