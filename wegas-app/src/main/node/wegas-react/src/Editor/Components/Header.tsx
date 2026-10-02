import { css, cx } from '@emotion/css';
import * as React from 'react';
import { useAuthorizations } from '../../Components/Contexts/AuthorizationsProvider';
import {
  featuresCTX,
  isFeatureEnabled,
  useFeatures,
} from '../../Components/Contexts/FeaturesProvider';
import { useLangToggler } from '../../Components/Contexts/LanguagesProvider';
import {
  roleCTX,
  useRolesToggler,
} from '../../Components/Contexts/RoleProvider';
import { DropMenu } from '../../Components/DropMenu';
import { CheckBox } from '../../Components/Inputs/Boolean/CheckBox';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { InfoBullet } from '../../Components/PageComponents/tools/InfoBullet';
import { themeVar } from '../../Components/Theme/ThemeVars';
import {
  bolder,
  componentMarginLeft,
  componentMarginRight,
  defaultMarginLeft,
  externalLlinkStyle,
  flex,
  flexBetween,
  flexRow,
  foregroundContent,
  itemCenter,
  itemsTop,
} from '../../css/classes';
import { reset as resetVariables } from '../../store/slices/variableDescriptors';
import { editorLanguages, EditorLanguagesCode } from '../../data/i18n';
import { editorEventRemove } from '../../data/Reducer/editingState';
import {
  loggerLevelSet,
  LoggerLevelValues,
  selectLogLevels,
} from '../../store/slices/logLevels';
import { selectCurrentUser } from '../../store/slices/user';
import { selectRolesId } from '../../store/slices/roles';
import { pageLoadersReset } from '../../store/slices/scriptRegistry';
import { useGameModel } from '../../Components/Hooks/useGameModel';
import { createExtraTestPlayer } from '../../store/slices/gameModel';
import {
  selectCurrentEditorLanguage,
  setEditorLanguage,
} from '../../store/slices/languages';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { shallowEqual, useAppSelector } from '../../store/hooks';
import { mainLayoutId } from '../layouts';
import { parseEvent } from './EntityEditor';
import { removeLayoutInLocal } from './LinearTabLayout/LinearLayout';
import ModelPropagator from './Modeler/ModelPropagation';
import { FontAwesome, IconComp } from './Views/FontAwesome';
import { dispatch, RootState, store } from '../../store/store';
import { selectEditorEvents } from '../../store/slices/editorEvents';
import { selectCurrentPlayerId } from '../../store/slices/players';
import { selectCurrentTeamId } from '../../store/slices/teams';

/*const transparentDropDownButton = css({
  backgroundColor: 'transparent',
  color: 'inherit',
  '&:hover': {
    backgroundColor: 'transparent',
  },
});*/

const reduceButtonStyle = css({
  '&.iconOnly': {
    justifyContent: 'center',
    borderRadius: 0,
    color: themeVar.colors.DisabledColor,
  },
});

const hideHeaderExpander = css({
  maxHeight: '0px',
  opacity: 0,
  padding: 0,
});

const headerExpander = css({
  maxHeight: '26px',
  opacity: 1,
  transition: 'all .8s ease',
});

const hideHeaderStyle = css({
  maxHeight: '0px',
  opacity: 0,
  padding: 0,
});

const showHeaderStyle = css({
  maxHeight: '200px',
  opacity: 1,
  overflow: 'hidden',
  paddingBottom: '2em',
  transition: 'all .8s ease',
});

const headerElementsStyle = css({
  flex: 1,
  justifyContent: 'center',
  display: 'flex',
  '& > span': {
    display: 'flex',
    alignItems: 'center',
  },
  '&:first-child > span': {
    marginRight: 'auto',
  },
  '&:last-child > span': {
    marginLeft: 'auto',
  },
});

// May be moved in a proper file to allow wider usage
// interface NotificationMenuProps {}
function NotificationMenu({ className, style }: ClassStyleId) {
  const i18nValues = useInternalTranslate(commonTranslations);
  const wegasEvents = useAppSelector(selectEditorEvents);
  const [receivedEvents, setReceivedEvents] = React.useState<number[]>([]);

  const unreadEvents = wegasEvents.filter(event => event.unread);
  const show = unreadEvents.length > 0;
  const blink =
    wegasEvents.filter(event => !receivedEvents.includes(event.timestamp))
      .length > 0;

  return (
    <DropMenu
      onOpen={() => setReceivedEvents(wegasEvents.map(e => e.timestamp))}
      label={
        <div>
          {i18nValues.header.notifications}
          <InfoBullet
            show={show}
            blink={blink}
            message={String(unreadEvents.length)}
          />
        </div>
      }
      items={wegasEvents.map(event => {
        const { message, onRead } = parseEvent(event);

        return {
          value: event.timestamp,
          label: (
            <div
              className={cx(flex, flexRow, itemCenter)}
              onMouseEnter={() => {
                if (event.unread) {
                  onRead();
                }
              }}
            >
              {event.unread && <Button icon="exclamation" noHover />}
              <div>
                {`${new Date(event.timestamp).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })} ${message}`}
              </div>
              <Button
                icon="times"
                onClick={e => {
                  e.stopPropagation();
                  dispatch(editorEventRemove(event.timestamp));
                }}
              />
            </div>
          ),
        };
      })}
      onSelect={(_item, _keys) => {
        // Could be used to open a tab to an event log
      }}
      containerClassName={className}
      style={style}
    />
  );
}

function useLoggerLevelSelector() {
  const currentLevels = useAppSelector(selectLogLevels);

  return {
    value: 'logger',
    label: <span>Loggers</span>,
    items: Object.entries(currentLevels).map(([loggerName, currentLevel]) => {
      return {
        value: loggerName,
        label: loggerName,
        items: LoggerLevelValues.map(value => {
          return {
            value: value,
            label: (
              <div
                onClick={() => {
                  dispatch(
                    loggerLevelSet({
                      loggerName: loggerName,
                      level: currentLevel !== value ? value : 'OFF',
                    }),
                  );
                }}
              >
                <CheckBox
                  horizontal
                  radio
                  value={value === currentLevel}
                  label={value}
                  onChange={(v: boolean) => {
                    dispatch(
                      loggerLevelSet({
                        loggerName: loggerName,
                        level: v ? value : 'OFF',
                      }),
                    );
                  }}
                />
              </div>
            ),
          };
        }),
      };
    }),
  };
}

function sessionSelector(s: RootState) {
  return {
    user: selectCurrentUser(s),
    currentPlayerId: selectCurrentPlayerId(s),
    currentTeamId: selectCurrentTeamId(s),
  };
}

export default function Header() {
  const { currentFeatures } = React.useContext(featuresCTX);
  const { currentRole } = React.useContext(roleCTX);
  const i18nValues = useInternalTranslate(commonTranslations);
  const [showHeader, setShowHeader] = React.useState(true);
  const gameModel = useGameModel();
  const userLanguage = useAppSelector(selectCurrentEditorLanguage);
  const { user, currentPlayerId, currentTeamId } = useAppSelector(
    sessionSelector,
    shallowEqual,
  );
  const featuresToggler = useFeatures();
  const roleToggler = useRolesToggler();
  const langSelector = useLangToggler();
  const loggerLevelTogglers = useLoggerLevelSelector();
  const authorizationTogglers = useAuthorizations();

  const teams = useAppSelector(s => {
    return Object.values(s.teams.entities);
  }, shallowEqual);

  const createExtraTestPlayerItem: DropMenuItem<unknown> = {
    label: (
      <div
        onClick={() => {
          dispatch(createExtraTestPlayer(gameModel.id!));
        }}
      >
        {i18nValues.header.addExtraTestPlayer}
      </div>
    ),
  };

  const teamsMenuItem: DropMenuItem<unknown> = {
    label: i18nValues.header.teams,
    value: '-1',
    items: teams
      .sort((a, b) => {
        return (a.name ?? '').localeCompare(b.name ?? '');
      })
      .map(team => {
        return {
          value: team.id,
          label: (
            <a
              href={`./edit.html?teamId=${team.id}`}
              target="_blank"
              rel="noreferrer"
              className={cx(externalLlinkStyle, {
                [bolder]: currentTeamId === team.id,
              })}
            >
              <IconComp icon="external-link-alt" />
              {team.name}
            </a>
          ),
          items: team.players.map(player => {
            return {
              label: (
                <a
                  href={`./edit.html?id=${player.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={cx(externalLlinkStyle, {
                    [bolder]: currentPlayerId === player.id,
                  })}
                >
                  <IconComp icon="external-link-alt" />
                  {player.name}
                  {player.userId == null ? ` (${player.id})` : null}
                </a>
              ),
              value: player.id,
            };
          }),
        };
      }),
  };

  return (
    <>
      <Button
        className={cx(reduceButtonStyle, headerExpander, {
          [hideHeaderExpander]: showHeader,
        })}
        noBackground={false}
        icon="chevron-down"
        tooltip={i18nValues.header.show}
        onClick={() => setShowHeader(true)}
      ></Button>
      <div
        className={cx(
          flex,
          itemsTop,
          flexBetween,
          foregroundContent,
          showHeaderStyle,
          {
            [hideHeaderStyle]: !showHeader,
          },
        )}
      >
        <div className={headerElementsStyle}>
          <span>
            <FontAwesome icon="user" />
            <span className={componentMarginLeft}>{user.name}</span>
            <DropMenu
              label={<IconComp icon="cog" />}
              items={[
                roleToggler,
                featuresToggler,
                {
                  label: i18nValues.language + ': ' + userLanguage,
                  items: Object.entries(editorLanguages).map(
                    ([key, value]) => ({
                      value: key,
                      label: (
                        <div
                          onClick={() => {
                            dispatch(
                              setEditorLanguage(key as EditorLanguagesCode),
                            );
                          }}
                          className={cx(flex, flexRow, itemCenter)}
                        >
                          <CheckBox
                            value={userLanguage === key}
                            onChange={() => {
                              dispatch(
                                setEditorLanguage(key as EditorLanguagesCode),
                              );
                            }}
                            label={key + ' : ' + value}
                            horizontal
                          />
                        </div>
                      ),
                      id: key,
                    }),
                  ),
                },
                loggerLevelTogglers,
                {
                  label: (
                    <div
                      onClick={() => {
                        removeLayoutInLocal(
                          mainLayoutId,
                          selectRolesId(store.getState()),
                          currentRole,
                        );
                        window.location.reload();
                      }}
                      className={css({ padding: '5px 10px' })}
                    >
                      <IconComp icon="undo" /> {i18nValues.header.resetLayout}
                    </div>
                  ),
                },
                authorizationTogglers,
              ]}
              buttonClassName={cx(
                defaultMarginLeft,
                css({ padding: '5px 5px' }),
              )}
            />
          </span>
        </div>
        <div className={headerElementsStyle}>
          <span>
            <h1 className={css({ margin: 0 })}>{gameModel.name}</h1>
          </span>
          <Button
            className={reduceButtonStyle}
            noBackground={false}
            icon="chevron-up"
            tooltip={i18nValues.header.hide}
            onClick={() => setShowHeader(false)}
          ></Button>
        </div>
        <div className={headerElementsStyle}>
          <span>
            <Button
              label={i18nValues.restart}
              icon={'redo'}
              onClick={() => {
                dispatch(
                  resetVariables(),
                );
                dispatch(pageLoadersReset());
              }}
              className={componentMarginRight}
            />
            {isFeatureEnabled(currentFeatures, 'MODELER') && (
              <ModelPropagator gameModel={gameModel} />
            )}
            {isFeatureEnabled(currentFeatures, 'ADVANCED') && (
              <NotificationMenu className={componentMarginRight} />
            )}
            <DropMenu
              label={<IconComp icon="gamepad" />}
              items={[
                langSelector,
                ...(isFeatureEnabled(currentFeatures, 'ADVANCED')
                  ? [teamsMenuItem, createExtraTestPlayerItem]
                  : []),
              ]}
              itemDirection="left"
            />
          </span>
        </div>
      </div>
    </>
  );
}
