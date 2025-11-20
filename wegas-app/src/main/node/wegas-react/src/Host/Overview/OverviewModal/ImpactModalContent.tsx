import { css, cx } from '@emotion/css';
import JSONForm from 'jsoninput';
import * as React from 'react';
import { IPlayer } from 'wegas-ts-api';
import { globals } from '../../../Components/Hooks/sandbox';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { TabLayout } from '../../../Components/TabLayout/TabLayout';
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
import { ReparentableRoot } from '../../../Editor/Components/Reparentable';
import { wwarn } from '../../../Helper/wegaslog';
import { tabsLineStyle } from '../../HostLayout';
import { ActionItem } from '../Overview';
import { OverviewTab, overviewTabStyle } from '../OverviewTab';
import { modalButtonsContainer } from './OverviewModal';
import { parseEvent } from '../../../Editor/Components/EntityEditor';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { classOrNothing } from '../../../Helper/className';

const jsonFormStyle: string = css({
  '>div': {
    margin: '0',
  },
});

const errorMessageContainerStyle = css({
  maxWidth: '300px',
  margin: 'auto',
  display: 'flex',
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

  const [showToast, setShowToast] = React.useState<boolean>(false);
  const [showError, setShowError] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const recurscript = React.useCallback(
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
              setShowError(true);
              setMessage(parseEvent(exceptionEvent).message);
              return true;
            }
            setMessage('Impact successfully applied');
            setShowToast(true);
            return false;
          })
          .then((errorOccurred: boolean) => {
            recurscript(
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
    [message],
  );

  React.useEffect(() => {
    const toastTimeout = setTimeout(() => {
      setShowToast(false);
    }, 2000);

    return () => clearTimeout(toastTimeout);
  }, [showToast]);

  React.useEffect(() => {
    const errorTimeout = setTimeout(() => {
      setShowError(false);
    }, 3000);

    return () => clearTimeout(errorTimeout);
  }, [showError]);

  const functions = actions.map(({ doFn }) => {
    return `(${doFn})(team,payload)`;
  });

  const player = Array.isArray(team)
    ? team.map(t => t?.getPlayers()[0].getEntity())
    : team?.getPlayers()[0].getEntity();

  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      <div className={cx(flex, flexColumn, autoScroll)}>
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
      <div
        className={cx(
          errorMessageContainerStyle,
          classOrNothing('hidden', !showError && !showToast),
          classOrNothing('success', showToast),
        )}
      >
        <div className={cx(textCenter, autoMargin)}>{message}</div>
      </div>
      <div
        className={cx(
          flex,
          flexRow,
          flexDistribute,
          modalButtonsContainer,
          showError || showToast ? hidden : '',
        )}
      >
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
  const [showToast, setShowToast] = React.useState<boolean>(false);
  const [showError, setShowError] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const player = Array.isArray(team)
    ? team.map(t => t?.getPlayers()[0].getEntity())
    : team?.getPlayers()[0].getEntity();

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
            setShowError(true);
            setMessage(parseEvent(exceptionEvent).message);
            return true;
          }
          setMessage('Impact successfully applied');
          setShowToast(true);
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
    [script, onExit, refreshOverview],
  );

  React.useEffect(() => {
    const toastTimeout = setTimeout(() => {
      setShowToast(false);
    }, 2000);

    return () => clearTimeout(toastTimeout);
  }, [showToast]);

  React.useEffect(() => {
    const errorTimeout = setTimeout(() => {
      setShowError(false);
    }, 3000);

    return () => clearTimeout(errorTimeout);
  }, [showError]);

  return (
    <div className={cx(flex, flexColumn, grow)}>
      <JSONForm
        value={{ script }}
        schema={advancedImpactSchema}
        onChange={({ script }) => {
          setScript(script);
        }}
      />
      <div
        className={cx(
          errorMessageContainerStyle,
          classOrNothing('hidden', !showError && !showToast),
          classOrNothing('success', showToast),
        )}
      >
        <div className={cx(textCenter, autoMargin)}>{message}</div>
      </div>
      <div
        className={cx(
          flex,
          flexRow,
          flexDistribute,
          modalButtonsContainer,
          showError || showToast ? hidden : '',
        )}
      >
        <Button
          disabled={player == null}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() => {
            if (Array.isArray(team) && Array.isArray(player)) {
              team.map((_t, i) => {
                runScript(player[i]);
              });
            } else if (!Array.isArray(team) && !Array.isArray(player)) {
              runScript(player);
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
