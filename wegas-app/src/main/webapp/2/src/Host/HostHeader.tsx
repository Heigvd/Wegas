import * as React from 'react';
import { css, cx } from 'emotion';
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

export default function HostHeader() {
  return (
    <div className={cx(flex, itemCenter, foregroundContent, headerStyle)}>
      <div className={cx(flex, grow, flexRow, itemCenter)}>
        <Title>{CurrentGame.name}</Title>
        <Title level={'3'}>{CurrentGM.name}</Title>
      </div>
      <LangToggler />
      {/* <FeatureToggler
            className={cx(componentMarginLeft, componentMarginRight)}
          />
          {isFeatureEnabled(currentFeatures, 'ADVANCED') && (
            <NotificationMenu className={componentMarginRight} />
          )} */}
      <FontAwesome icon="user" />
      <span className={componentMarginLeft}>{CurrentUser.name}</span>
      <Button
        icon={'magic'}
        tooltip="Edit this game"
        onClick={() => {
          const win = window.open(
            'edit.html?gameId=' + CurrentGame.id,
            '_blank',
          );
          win?.focus();
        }}
      />
    </div>
  );
}
