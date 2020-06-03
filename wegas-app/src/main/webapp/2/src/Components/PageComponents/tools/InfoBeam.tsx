import * as React from 'react';
import { css, keyframes, cx } from 'emotion';
import { themeVar } from '../../Style/Theme';
import { useScript } from '../../Hooks/useScript';

const infoBeamStyle = css({
  position: 'absolute',
  color: themeVar.primaryLighterTextColor,
  backgroundColor: themeVar.warningColor,
  borderRadius: '50%',
  padding: '0px 5px 0px 5px',
});

const blinkAnimation = keyframes(`
  50%{opacity: 0.0;}
  `);

const blinkStyle = css(`
    animation: ${blinkAnimation} 1.0s linear infinite;
  `);

export interface InfoBeamProps {
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

export function InfoBeam({
  showScript,
  blinkScript,
  messageScript,
}: InfoBeamProps) {
  const show = useScript<boolean>(showScript?.content || 'true');
  const blink = useScript<boolean>(blinkScript?.content || 'false');
  const message = useScript<string>(messageScript?.content || '');

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
