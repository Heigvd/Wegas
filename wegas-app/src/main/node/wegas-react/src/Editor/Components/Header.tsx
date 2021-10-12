import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  featuresCTX,
  FeatureToggler,
  isFeatureEnabled,
} from '../../Components/Contexts/FeaturesProvider';
import { LangToggler } from '../../Components/Contexts/LanguagesProvider';
import { roleCTX, RoleSelector } from '../../Components/Contexts/RoleProvider';
import { DropMenu } from '../../Components/DropMenu';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { InfoBullet } from '../../Components/PageComponents/tools/InfoBullet';
import { themeVar } from '../../Components/Theme/ThemeVars';
import {
  componentMarginLeft,
  componentMarginRight,
  defaultMarginLeft,
  expandWidth,
  flex,
  flexBetween,
  flexRow,
  foregroundContent,
  itemCenter,
  itemsTop,
} from '../../css/classes';
import { Actions } from '../../data';
import { editorLanguages, EditorLanguagesCode } from '../../data/i18n';
import { editorEventRemove } from '../../data/Reducer/globalState';
import { State } from '../../data/Reducer/reducers';
import { GameModel, Global } from '../../data/selectors';
import { selectCurrentEditorLanguage } from '../../data/selectors/Languages';
import { store, useStore } from '../../data/Stores/store';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { parseEvent } from './EntityEditor';
import { mainLayoutId } from './Layout';
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

function wegasEventSelector(s: State) {
  return s.global.events;
}
// May be moved in a proper file to allow wider usage
// interface NotificationMenuProps {}
function NotificationMenu({ className, style }: ClassStyleId) {
  const i18nValues = useInternalTranslate(commonTranslations);
  const wegasEvents = useStore(wegasEventSelector);
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
                {new Date(event.timestamp).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })}
              </div>
              <div>{message}</div>
              <Button
                icon="times"
                onClick={e => {
                  e.stopPropagation();
                  store.dispatch(editorEventRemove(event.timestamp));
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
export default function Header() {
  const { currentFeatures } = React.useContext(featuresCTX);
  const { currentRole } = React.useContext(roleCTX);
  const i18nValues = useInternalTranslate(commonTranslations);
  const [showHeader, setShowHeader] = React.useState(true);
  const { gameModel, user, userLanguage } = useStore(s => ({
    gameModel: GameModel.selectCurrent(),
    user: Global.selectCurrentUser(),
    userLanguage: selectCurrentEditorLanguage(s),
  }));
  const dispatch = store.dispatch;
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
        <div className={cx(flex, itemCenter)}>
          <FontAwesome icon="user" />
          <span className={componentMarginLeft}>{user.name}</span>
          <DropMenu
            label={<IconComp icon="cog" />}
            items={[
              {
                label: (
                  <RoleSelector
                    buttonClassName={transparentDropDownButton}
                    className={expandWidth}
                  />
                ),
              },
              {
                label: (
                  <FeatureToggler
                    buttonClassName={transparentDropDownButton}
                    className={expandWidth}
                  />
                ),
              },
              {
                label: (
                  <DropMenu
                    label={i18nValues.language + ': ' + userLanguage}
                    items={Object.entries(editorLanguages).map(
                      ([key, value]) => ({
                        label: key + ': ' + value,
                        id: key,
                      }),
                    )}
                    onSelect={item => {
                      dispatch(
                        Actions.EditorActions.setEditorLanguage(
                          item.id as EditorLanguagesCode,
                        ),
                      );
                    }}
                    direction="right"
                    buttonClassName={transparentDropDownButton}
                    style={{ width: '100%' }}
                  />
                ),
              },
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
            buttonClassName={cx(defaultMarginLeft, css({ padding: '5px 5px' }))}
          />
        </div>
        <h1 className={css({ margin: 0 })}>{gameModel.name}</h1>

        <DropMenu
          label={<IconComp icon="gamepad" />}
          items={[
            {
              label: (
                <LangToggler
                  label={i18nValues.language}
                  className={expandWidth}
                  buttonClassName={transparentDropDownButton}
                  direction="right"
                />
              ),
              value: 'selectGameLanguage',
            },
            {
              label: (
                <ConfirmButton
                  label={i18nValues.restart}
                  icon="fast-backward"
                  onAction={success => {
                    if (success) {
                      dispatch(Actions.VariableDescriptorActions.reset());
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
        {isFeatureEnabled(currentFeatures, 'ADVANCED') && (
          <NotificationMenu className={componentMarginRight} />
        )}
      </div>
    </>
  );
}
