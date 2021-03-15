import * as React from 'react';
import { css, cx } from 'emotion';
import { FontAwesome } from '../Editor/Components/Views/FontAwesome';
// import { LangToggler } from '../Components/Contexts/LanguagesProvider';
import {
  flex,
  itemCenter,
  grow,
  foregroundContent,
  flexRow,
  itemBottom,
  componentMarginLeft,
  // defaultMarginRight,
} from '../css/classes';
import { Title } from '../Components/Inputs/String/Title';
import { Button } from '../Components/Inputs/Buttons/Button';
import { trainerTheme } from './Overview/HostTheme';
const headerStyle = css({
  marginBottom: trainerTheme.spacing.LargePadding,
});
const TitleStyle = css({
  fontFamily: trainerTheme.text.TextFont1,
  marginRight: trainerTheme.spacing.MediumPadding,
});

export default function HostHeader() {
  return (
    <div className={cx(flex, itemCenter, foregroundContent, headerStyle)}>
      <div className={cx(flex, grow, flexRow, itemBottom)}>
        <Title className={TitleStyle}>{CurrentGame.name}</Title>
        <Title level={'3'}>{CurrentGM.name}</Title>
      </div>
      {/* <LangToggler className={defaultMarginRight}/> */}
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
