import { css } from '@emotion/css';
import * as React from 'react';
import { themeVar } from '../../Components/Theme/ThemeVars';

const messageStyle = (color?: string) =>
  css({
    color,
    margin: '5px',
    whiteSpace: 'pre-wrap',
    fontSize: '0.9em',
    lineHeight: '0.9em',
  });

export const messageStringStyles = [
  'normal',
  'warning',
  'error',
  'succes',
] as const;

export type MessageStringStyle = typeof messageStringStyles[number];

interface MessageStringProps {
  /**
   * value - the value of the text
   */
  value?: string;
  /**
   * type - changes the style of the text, normal by default
   */
  type?: MessageStringStyle;
  /**
   * duration - the time during which is the value displayed.
   * If undefined, the text is displayed forever
   */
  duration?: number;
  /**
   * onLabelVanish - called when the duration is reached (never if no duration sat)
   */
  onLabelVanish?: () => void;
}

function colorByType(type?: MessageStringStyle) {
  switch (type) {
    case 'succes': {
      return themeVar.colors.SuccessColor;
    }
    case 'warning': {
      return themeVar.colors.WarningColor;
    }
    case 'error': {
      return themeVar.colors.ErrorColor;
    }
    case 'normal':
    default: {
      return themeVar.colors.DarkTextColor;
    }
  }
}

/**
 * StyledLabel is a component that creates a styled label with text
 */
export function MessageString({
  type,
  value,
  duration,
  onLabelVanish,
}: MessageStringProps) {
  const timeout = React.useRef(0);
  const [text, setText] = React.useState(value);
  React.useEffect(() => {
    clearTimeout(timeout.current);
    setText(value);
    if (duration !== undefined) {
      timeout.current = window.setTimeout(() => {
        setText('');
        onLabelVanish && onLabelVanish();
      }, duration);
    }
    return () => {
      clearTimeout(timeout.current);
    };
  }, [value, duration, onLabelVanish]);

  const color = colorByType(type);

  return (
    <div className={messageStyle(color)}>{text !== undefined ? text : ''}</div>
  );
}
