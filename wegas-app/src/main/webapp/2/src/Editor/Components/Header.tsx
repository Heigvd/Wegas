import * as React from 'react';
import { GameModel, Global } from '../../data/selectors';
import { css } from 'emotion';
import { StoreConsumer } from '../../data/store';

const inline = css({
  display: 'inline-block',
});
const float = css({ float: 'right' });
export default function Header() {
  return (
    <StoreConsumer
      selector={() => ({
        gameModel: GameModel.selectCurrent(),
        user: Global.selectCurrentUser(),
      })}
    >
      {({ state: { gameModel, user } }) => (
        <div>
          <h2 className={inline}>{gameModel.name}</h2>
          <span className={float}>{user.name}</span>
        </div>
      )}
    </StoreConsumer>
  );
}
