import * as React from 'react';
import { GameModel, Global } from '../../data/selectors';
import { css, cx } from 'emotion';
import { StoreConsumer } from '../../data/store';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { Actions } from '../../data';
import { FontAwesome } from './Views/FontAwesome';
import { FeatureToggler } from '../../Components/Contexts/FeaturesProvider';
import { LangToggler } from '../../Components/Contexts/LanguagesProvider';
import { flex, itemCenter, grow, foregroundContent } from '../../css/classes';
import { themeVar } from '../../Components/Style/ThemeVars';
import { Title } from '../../Components/Inputs/String/Title';

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
              window.localStorage.removeItem('DnDGridLayoutData');
              window.location.reload();
            }}
          />
        </div>
      )}
    </StoreConsumer>
  );
}
