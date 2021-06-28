import * as React from 'react';
import { css, keyframes, cx } from 'emotion';
import { useScript } from '../../Hooks/useScript';
import { themeVar } from '../../Theme/ThemeVars';
import { IScript } from 'wegas-ts-api';

const infoBeamStyle = css({
  position: 'absolute',
  padding: '3px',
  color: themeVar.colors.LightTextColor,
  backgroundColor: themeVar.colors.WarningColor,
  borderRadius: '50%',
  height: '21px',
  width: '21px',
  textAlign: 'center',
  fontSize: '12px',
  lineHeight: '15px',
  fontWeight: 'normal',
  zIndex: 10,
});

const blinkAnimation = keyframes(`
  50%{opacity: 0.0;}
  `);

const blinkStyle = css(`
    animation: ${blinkAnimation} 1.0s linear infinite;
  `);

export interface InfoBulletProps {
  /**
   * show - the condition that determines if the info beam must be visible or not
   * If not set, the component will be shown
   */
  show?: boolean;
  /**
   * blink - the condition that determines if the info beam must be blinking or not
   */
  blink?: boolean;
  /**
   * message - the message to be displayed in the info beam
   */
  message?: string;
}

export function InfoBullet({ show, blink, message }: InfoBulletProps) {
  return show !== false ? (
    <span
      ref={container => {
        if (container) {
          const { width, height } = container.getBoundingClientRect();
          const top = -(width / 4) - 1;
          const right = -(height / 4) - 1;
          container.style.setProperty('right', `${right}px`);
          container.style.setProperty('top', `${top}px`);
        }
      }}
      className={cx(infoBeamStyle, { [blinkStyle]: blink })}
    >
      {message}
    </span>
  ) : null;
}

export interface PlayerInfoBulletProps {
  /**
   * showScript - the condition that determines if the info beam must be visible or not
   */
  showScript?: IScript;
  /**
   * blinkScript - the condition that determines if the info beam must be blinking or not
   */
  blinkScript?: IScript;
  /**
   * messageScript - the script that returns the message to be displayed in the info beam
   */
  messageScript?: IScript;
}

export function PlayerInfoBullet({
  showScript,
  blinkScript,
  messageScript,
}: PlayerInfoBulletProps) {
  let show = useScript<boolean>(showScript);
  show = show == null ? true : false;
  const blink = useScript<boolean>(blinkScript) || false;
  const message = useScript<string>(messageScript) || '';

  return <InfoBullet show={show} blink={blink} message={message} />;
}
