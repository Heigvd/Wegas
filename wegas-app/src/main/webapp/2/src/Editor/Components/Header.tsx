import * as React from 'react';
import { GameModel, Global } from '../../data/selectors';
import { css, cx } from 'emotion';
import { useStore, store } from '../../data/Stores/store';
import { Actions } from '../../data';
import { FontAwesome, IconComp } from './Views/FontAwesome';
import {
  FeatureToggler,
  featuresCTX,
  isFeatureEnabled,
} from '../../Components/Contexts/FeaturesProvider';
import { LangToggler } from '../../Components/Contexts/LanguagesProvider';
import {
  flex,
  itemCenter,
  foregroundContent,
  flexRow,
  componentMarginLeft,
  componentMarginRight,
  flexBetween,
  itemsTop,
  defaultMarginLeft,
} from '../../css/classes';
import { Title } from '../../Components/Inputs/String/Title';
import { mainLayoutId } from './Layout';
import { InfoBullet } from '../../Components/PageComponents/tools/InfoBullet';
import { DropMenu } from '../../Components/DropMenu';
import { parseEvent } from './EntityEditor';
import { editorEventRemove } from '../../data/Reducer/globalState';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { State } from '../../data/Reducer/reducers';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { commonTranslations } from '../../i18n/common/common';
import { editorLanguages, EditorLanguagesCode } from '../../data/i18n';

const transparentDropDownButton = css({
  backgroundColor: 'transparent',
  color: 'inherit',
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
  const i18nValues = useInternalTranslate(commonTranslations);
  const { gameModel, user, userLanguage } = useStore(s => ({
    gameModel: GameModel.selectCurrent(),
    user: Global.selectCurrentUser(),
    userLanguage: s.global.currentEditorLanguageCode,
  }));
  const dispatch = store.dispatch;
  return (
    <div
      className={cx(
        flex,
        itemsTop,
        flexBetween,
        foregroundContent,
        css({ paddingBottom: '1em' }),
      )}
    >
      <div className={cx(flex, itemCenter)}>
        <FontAwesome icon="user" />
        <span className={componentMarginLeft}>{user.name}</span>
        <DropMenu
          label={<IconComp icon="cog" />}
          items={[
            {
              label: <FeatureToggler className={transparentDropDownButton} />,
              value: 'selectFeatures',
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
                      Actions.EditorActions.setLanguage(
                        item.id as EditorLanguagesCode,
                      ),
                    );
                  }}
                  direction="right"
                  buttonClassName={transparentDropDownButton}
                />
              ),
              value: 'selectUserLanguage',
            },
            {
              label: (
                <div
                  onClick={() => {
                    window.localStorage.removeItem(
                      'DnDGridLayoutData.' + mainLayoutId,
                    );
                    window.location.reload();
                  }}
                  className={css({padding: '5px 10px'})}
                >
                  <IconComp icon="undo" /> {i18nValues.header.resetLayout}
                </div>
              ),
              value: 'resetLayout',
            },
          ]}
          buttonClassName={cx(defaultMarginLeft, css({ padding: '5px 5px' }))}
        />
      </div>
      <Title className={css({ margin: 0 })}>{gameModel.name}</Title>

      <DropMenu
        label={<IconComp icon="gamepad" />}
        items={[
          {
            label: (
              <LangToggler
                label={i18nValues.language}
                className={transparentDropDownButton}
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
                modalMessage= {i18nValues.header.restartGame + "?"}
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
  );
}
