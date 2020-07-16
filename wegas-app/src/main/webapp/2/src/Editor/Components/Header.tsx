import * as React from 'react';
import { GameModel, Global } from '../../data/selectors';
import { css, cx } from 'emotion';
import { StoreConsumer, useStore, store } from '../../data/store';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { Actions } from '../../data';
import { FontAwesome } from './Views/FontAwesome';
import { FeatureToggler } from '../../Components/Contexts/FeaturesProvider';
import { LangToggler } from '../../Components/Contexts/LanguagesProvider';
import {
  flex,
  itemCenter,
  grow,
  foregroundContent,
  flexRow,
} from '../../css/classes';
import { Title } from '../../Components/Inputs/String/Title';
import { mainLayoutId } from './Layout';
import { InfoBullet } from '../../Components/PageComponents/tools/InfoBullet';
import { Menu } from '../../Components/Menu';
import { parseEvent } from './EntityEditor';
import { editorEventRemove } from '../../data/Reducer/globalState';
import { themeVar } from '../../Components/Style/ThemeVars';

// May be moved in a proper file to allow wider usage
// interface NotificationMenuProps {}
function NotificationMenu(/*{}: NotificationMenuProps*/) {
  const wegasEvents = useStore(s => s.global.events);
  const [recievedEvents, setRecievedEvents] = React.useState<number[]>([]);

  const unreadEvents = wegasEvents.filter(event => event.unread);
  const show = unreadEvents.length > 0;
  const blink =
    wegasEvents.filter(event => !recievedEvents.includes(event.timestamp))
      .length > 0;

  return (
    <Menu
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
              {event.unread && <IconButton icon="exclamation" noHover />}
              <div>
                {new Date(event.timestamp).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })}
              </div>
              <div>{message}</div>
              <IconButton
                icon="trash"
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
    />
  );
}

const headerStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
});

export default function Header() {
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
          <FeatureToggler />
          <NotificationMenu />
          <FontAwesome icon="user" />
          <span>{user.name}</span>
          <IconButton
            icon="undo"
            tooltip="Restart"
            onClick={() => dispatch(Actions.VariableDescriptorActions.reset())}
          />
          <IconButton
            icon={[{ icon: 'undo' }, { icon: 'window-restore', size: 'xs' }]}
            tooltip="Reset layout"
            onClick={() => {
              window.localStorage.removeItem(
                'DnDGridLayoutData.' + mainLayoutId,
              );
              window.location.reload();
            }}
          />
        </div>
      )}
    </StoreConsumer>
  );
}
