import * as React from 'react';
import { Game, GameModel, Global } from '../data/selectors';
import { css, cx } from 'emotion';
import { useStore } from '../data/Stores/store';
import { FontAwesome } from '../Editor/Components/Views/FontAwesome';
import { LangToggler } from '../Components/Contexts/LanguagesProvider';
import {
  flex,
  itemCenter,
  grow,
  foregroundContent,
  flexRow,
  componentMarginLeft,
} from '../css/classes';
import { Title } from '../Components/Inputs/String/Title';
import { themeVar } from '../Components/Style/ThemeVars';
import { Button } from '../Components/Inputs/Buttons/Button';

const headerStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
});

function hostHeaderSelector() {
  return {
    game: Game.selectCurrent(),
    gameModel: GameModel.selectCurrent(),
    user: Global.selectCurrentUser(),
  };
}

export default function HostHeader() {
  // const { currentFeatures } = React.useContext(featuresCTX);

  const { game, gameModel, user } = useStore(hostHeaderSelector);

  return (
    <div className={cx(flex, itemCenter, foregroundContent, headerStyle)}>
      <div className={cx(flex, grow, flexRow, itemCenter)}>
        <Title>{game.name}</Title>
        <Title level={'3'}>{gameModel.name}</Title>
      </div>
      <LangToggler />
      {/* <FeatureToggler
            className={cx(componentMarginLeft, componentMarginRight)}
          />
          {isFeatureEnabled(currentFeatures, 'ADVANCED') && (
            <NotificationMenu className={componentMarginRight} />
          )} */}
      <FontAwesome icon="user" />
      <span className={componentMarginLeft}>{user.name}</span>
      <Button
        icon={'magic'}
        tooltip="Edit this game"
        onClick={() => {
          const win = window.open('edit.html?gameId=' + game.id, '_blank');
          win?.focus();
        }}
      />
    </div>
  );
}
