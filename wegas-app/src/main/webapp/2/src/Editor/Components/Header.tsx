import * as React from 'react';
import { GameModel, Global } from '../../data/selectors';
import { css } from 'emotion';
import { StoreConsumer } from '../../data/store';
import { IconButton } from '../../Components/Button/IconButton';
import { Actions } from '../../data';
import { FontAwesome } from './Views/FontAwesome';

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
  alignItems: 'center',
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
        <div className={flex}>
          <h2 className={grow}>{gameModel.name}</h2>
          <FontAwesome icon="user" />
          <span>{user.name}</span>
          <IconButton
            icon="undo"
            tooltip="Restart"
            onClick={() => dispatch(Actions.VariableDescriptorActions.reset())}
          />
          <IconButton
            icon="trash-restore"
            tooltip="Reset layout"
            onClick={() => {
              window.localStorage.removeItem('DnDGridLayoutData');
              window.location.reload();
            }}
          />
        </div>
      )}
    </StoreConsumer>
  );
}
