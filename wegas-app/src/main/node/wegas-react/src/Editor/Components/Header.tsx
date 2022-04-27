import { css, cx } from '@emotion/css';
import * as React from 'react';
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
import { shallowDifferent } from '../../Components/Hooks/storeHookFactory';
import { CheckBox } from '../../Components/Inputs/Boolean/CheckBox';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { InfoBullet } from '../../Components/PageComponents/tools/InfoBullet';
import { themeVar } from '../../Components/Theme/ThemeVars';
import {
  bolder,
  componentMarginLeft,
  componentMarginRight,
  defaultMarginLeft,
  flex,
  flexBetween,
  flexRow,
  foregroundContent,
  itemCenter,
  itemsTop,
  externalLlinkStyle,
} from '../../css/classes';
import { Actions } from '../../data';
import { ActionCreator } from '../../data/actions';
import { editorLanguages, EditorLanguagesCode } from '../../data/i18n';
import {
  EditingState,
  editorEventRemove,
} from '../../data/Reducer/editingState';
import { LoggerLevelValues } from '../../data/Reducer/globalState';
import { State } from '../../data/Reducer/reducers';
import { GameModel, Global } from '../../data/selectors';
import { selectCurrentEditorLanguage } from '../../data/selectors/Languages';
import { editingStore, useEditingStore } from '../../data/Stores/editingStore';
import { store, useStore } from '../../data/Stores/store';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { mainLayoutId } from '../layouts';
import { parseEvent } from './EntityEditor';
import { FontAwesome, IconComp } from './Views/FontAwesome';

const transparentDropDownButton = css({
  backgroundColor: 'transparent',
  color: 'inherit',
  '&:hover': {
    backgroundColor: 'transparent',
  },
});

const reduceButtonStyle = css({
  '&.iconOnly': {
    justifyContent: 'center',
    borderRadius: 0,
    color: themeVar.colors.DisabledColor,
  },
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
  padding: '2em 0',
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

function wegasEventSelector(s: EditingState) {
  return s.events;
}
// May be moved in a proper file to allow wider usage
// interface NotificationMenuProps {}
function NotificationMenu({ className, style }: ClassStyleId) {
  const i18nValues = useInternalTranslate(commonTranslations);
  const wegasEvents = useEditingStore(wegasEventSelector);
  const [recievedEvents, setRecievedEvents] = React.useState<number[]>([]);

  const unreadEvents = wegasEvents.filter(event => event.unread);
  const show = unreadEvents.length > 0;
  const blink =
    wegasEvents.filter(event => !recievedEvents.includes(event.timestamp))
      .length > 0;

  return (
    <DropMenu
      onOpen={() => setRecievedEvents(wegasEvents.map(e => e.timestamp))}
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
                  editingStore.dispatch(editorEventRemove(event.timestamp));
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
  const currentLevels = useStore(
    state => state.global.logLevels,
    shallowDifferent,
  );

  const dispatch = store.dispatch;

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
                    ActionCreator.LOGGER_LEVEL_SET({
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
                      ActionCreator.LOGGER_LEVEL_SET({
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

function globalStoreSelector(s: State) {
  return {
    gameModel: GameModel.selectCurrent(),
    user: Global.selectCurrentUser(),
    userLanguage: selectCurrentEditorLanguage(s),
    currentPlayerId: s.global.currentPlayerId,
    currentTeamId: s.global.currentTeamId,
  };
}

export default function Header() {
  const { currentFeatures } = React.useContext(featuresCTX);
  const { currentRole } = React.useContext(roleCTX);
  const i18nValues = useInternalTranslate(commonTranslations);
  const [showHeader, setShowHeader] = React.useState(true);
  const { gameModel, user, userLanguage, currentPlayerId, currentTeamId } =
    useStore(globalStoreSelector);
  const dispatch = store.dispatch;
  const featuresToggler = useFeatures();
  const roleToggler = useRolesToggler();
  const langSelector = useLangToggler();
  const loggerLevelTogglers = useLoggerLevelSelector();

  const teams = useStore(s => {
    return Object.values(s.teams);
  }, shallowDifferent);

  const createExtraTestPlayerItem: DropMenuItem<unknown> = {
    label: (
      <div
        onClick={() => {
          editingStore.dispatch(
            Actions.GameModelActions.createExtraTestPlayer(gameModel.id!),
          );
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
                  { player.name }{ player.userId == null ? ` (${player.id})` : null}
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
        className={cx(reduceButtonStyle, {
          [css({ borderBottom: '1px solid ' + themeVar.colors.DisabledColor })]:
            showHeader,
        })}
        noBackground={false}
        icon={showHeader ? 'chevron-up' : 'chevron-down'}
        tooltip={showHeader ? 'Hide header' : 'Show header'}
        onClick={() => setShowHeader(showHeader => !showHeader)}
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
                              Actions.EditorActions.setEditorLanguage(
                                key as EditorLanguagesCode,
                              ),
                            );
                          }}
                          className={cx(flex, flexRow, itemCenter)}
                        >
                          <CheckBox
                            value={
                              Actions.EditorActions.getEditorLanguage().payload
                                .language === key
                            }
                            onChange={() => {
                              dispatch(
                                Actions.EditorActions.setEditorLanguage(
                                  key as EditorLanguagesCode,
                                ),
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
                        window.localStorage.removeItem(
                          `DnDGridLayoutData.${mainLayoutId}.${
                            store.getState().global.roles.rolesId
                          }.${currentRole}`,
                        );
                        window.location.reload();
                      }}
                      className={css({ padding: '5px 10px' })}
                    >
                      <IconComp icon="undo" /> {i18nValues.header.resetLayout}
                    </div>
                  ),
                },
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
        </div>
        <div className={headerElementsStyle}>
          <span>
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
                {
                  label: (
                    <ConfirmButton
                      label={i18nValues.restart}
                      icon="fast-backward"
                      onAction={success => {
                        if (success) {
                          editingStore.dispatch(
                            Actions.VariableDescriptorActions.reset(),
                          );
                          dispatch(Actions.EditorActions.resetPageLoader());
                        }
                      }}
                      buttonClassName={transparentDropDownButton}
                      modalDisplay
                      modalMessage={i18nValues.header.restartGame + '?'}
                    />
                  ),
                  value: 'restartGame',
                },
              ]}
            />
          </span>
        </div>
      </div>
    </>
  );
}
