import * as React from 'react';
import { GameModel, Global } from '../../data/selectors';
import { cx } from 'emotion';
import { StoreConsumer } from '../../data/store';
import { IconButton } from '../../Components/Inputs/Button/IconButton';
import { Actions } from '../../data';
import { FontAwesome } from './Views/FontAwesome';
import { FeatureToggler } from '../../Components/Contexts/FeaturesProvider';
import { LangToggler } from '../../Components/Contexts/LanguagesProvider';
import { flex, itemCenter, grow, foregroundContent } from '../../css/classes';

export default function Header() {
  return (
    <StoreConsumer
      selector={() => ({
        gameModel: GameModel.selectCurrent(),
        user: Global.selectCurrentUser(),
      })}
    >
      {({ state: { gameModel, user }, dispatch }) => (
        <div className={cx(flex, itemCenter, foregroundContent)}>
          <h2 className={grow}>{gameModel.name}</h2>
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
