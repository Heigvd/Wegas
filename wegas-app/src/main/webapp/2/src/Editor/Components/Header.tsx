import * as React from 'react';
import { connect } from 'react-redux';
import { GameModel, Global } from '../../data/selectors';
import { css } from 'glamor';

const inline = css({
  display: 'inline-block',
});
const float = css({ float: 'right' });
function Header({ gameModel, user }: { gameModel: IGameModel; user: IUser }) {
  return (
    <div>
      <h2 {...inline}>{gameModel.name}</h2>
      <span {...float}>{user.name}</span>
    </div>
  );
}
export default connect(() => ({
  gameModel: GameModel.selectCurrent(),
  user: Global.selectCurrentUser(),
}))(Header);
