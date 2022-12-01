import * as React from 'react';
import { css, cx } from '@emotion/css';
import { FontAwesome } from '../Editor/Components/Views/FontAwesome';
// import { LangToggler } from '../Components/Contexts/LanguagesProvider';
import {
  flex,
  itemCenter,
  grow,
  foregroundContent,
  componentMarginLeft,
  flexColumn,
  justifyStart,
  // defaultMarginRight,
} from '../css/classes';
import { Title } from '../Components/Inputs/String/Title';
import { Button } from '../Components/Inputs/Buttons/Button';

const headerStyle = css({
  marginBottom: '10px',
});
const TitleStyle = css({
  margin: '5px 0',
  lineHeight: '100%',
});

export default function HostHeader() {
  return (
    <div className={cx(flex, itemCenter, foregroundContent, headerStyle)}>
      <div className={cx(flex, grow, flexColumn, justifyStart)}>
        <Title level={'2'} className={TitleStyle}>{CurrentGame.name}</Title>
        <p className={TitleStyle}>Scenario: {CurrentGM.name}</p>
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
