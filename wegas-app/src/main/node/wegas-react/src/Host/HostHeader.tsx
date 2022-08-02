import { css, cx } from '@emotion/css';
import * as React from 'react';
import { Button } from '../Components/Inputs/Buttons/Button';
import { Title } from '../Components/Inputs/String/Title';
import { FontAwesome } from '../Components/Views/FontAwesome';
// import { LangToggler } from '../Components/Contexts/LanguagesProvider';
import {
  componentMarginLeft,
  flex,
  flexColumn,
  foregroundContent,
  grow,
  itemCenter,
  justifyStart,
} from '../css/classes';

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
        <Title level={'2'} className={TitleStyle}>
          {CurrentGame.name}
        </Title>
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
