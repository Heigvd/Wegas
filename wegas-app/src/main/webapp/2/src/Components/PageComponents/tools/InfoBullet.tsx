import * as React from 'react';
import { css, keyframes, cx } from 'emotion';
import { useScript } from '../../Hooks/useScript';
import { themeVar } from '../../Style/ThemeVars';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';

const infoBeamStyle = css({
  position: 'absolute',
  color: themeVar.Common.colors.SecondaryTextColor,
  backgroundColor: themeVar.Common.colors.WarningColor,
  borderRadius: '50%',
  padding: '0px 5px 0px 5px',
  zIndex: 10000,
});

const blinkAnimation = keyframes(`
  50%{opacity: 0.0;}
  `);

const blinkStyle = css(`
    animation: ${blinkAnimation} 1.0s linear infinite;
  `);

export interface InfoBulletProps {
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

export function InfoBullet({
  showScript,
  blinkScript,
  messageScript,
}: InfoBulletProps) {
  let show = useScript<boolean>(showScript?.content);
  show = show == null ? true : false;
  const blink = useScript<boolean>(blinkScript?.content) || false;
  const message = useScript<string>(messageScript?.content) || '';

  return show !== false ? (
    <div
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
    </div>
  ) : null;
}
