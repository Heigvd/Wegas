import * as React from 'react';
import { GameModel, Global } from '../../data/selectors';
import { css, cx } from 'emotion';
import { StoreConsumer, useStore, store } from '../../data/Stores/store';
import { Actions } from '../../data';
import { FontAwesome } from './Views/FontAwesome';
import {
  FeatureToggler,
  featuresCTX,
  isFeatureEnabled,
} from '../../Components/Contexts/FeaturesProvider';
import { LangToggler } from '../../Components/Contexts/LanguagesProvider';
import {
  flex,
  itemCenter,
  grow,
  foregroundContent,
  flexRow,
  componentMarginLeft,
  componentMarginRight,
} from '../../css/classes';
import { Title } from '../../Components/Inputs/String/Title';
import { mainLayoutId } from './Layout';
import { InfoBullet } from '../../Components/PageComponents/tools/InfoBullet';
import { DropMenu } from '../../Components/DropMenu';
import { parseEvent } from './EntityEditor';
import { editorEventRemove } from '../../data/Reducer/globalState';
import { themeVar } from '../../Components/Style/ThemeVars';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { State } from '../../data/Reducer/reducers';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';

function wegasEventSelector(s: State) {
  return s.global.events;
}
// May be moved in a proper file to allow wider usage
// interface NotificationMenuProps {}
function NotificationMenu({ className, style }: ClassStyleId) {
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
          Notifications
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

const headerStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
});

export default function Header() {
  const { currentFeatures } = React.useContext(featuresCTX);

  return (
    <StoreConsumer
      selector={() => ({
        gameModel: GameModel.selectCurrent(),
        user: Global.selectCurrentUser(),
      })}
    >
      {({ state: { gameModel, user }, dispatch }) => (
        <div className={cx(flex, itemCenter, foregroundContent, headerStyle)}>
          <Title className={grow}>{gameModel.name}</Title>
          <LangToggler />
          <FeatureToggler
            className={cx(componentMarginLeft, componentMarginRight)}
          />
          {isFeatureEnabled(currentFeatures, 'ADVANCED') && (
            <NotificationMenu className={componentMarginRight} />
          )}
          <FontAwesome icon="user" />
          <span className={componentMarginLeft}>{user.name}</span>
          <ConfirmButton
            icon="undo"
            tooltip="Restart the game (applied to every scenarist)"
            onAction={success => {
              if (success) {
                dispatch(Actions.VariableDescriptorActions.reset());
                dispatch(Actions.EditorActions.resetPageLoader());
              }
            }}
            className={componentMarginLeft}
          />
          <Button
            icon={[{ icon: 'undo' }, { icon: 'window-restore', size: 'xs' }]}
            tooltip="Reset layout"
            onClick={() => {
              window.localStorage.removeItem(
                'DnDGridLayoutData.' + mainLayoutId,
              );
              window.location.reload();
            }}
            className={componentMarginLeft}
          />
        </div>
      )}
    </StoreConsumer>
  );
}
