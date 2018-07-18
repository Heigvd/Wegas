import * as React from 'react';
import { css } from 'emotion';
import * as Color from 'color';

interface ThemeProps {
  backgroundColor?: string;
  primaryColor?: string;
  lightTextColor?: string;
  darkTextColor?: string;
  warningColor?: string;
  errorColor?: string;
}

export const themeVar = {
  primaryColor: 'var(--primary-color)',
  primaryTextColor: 'var(--primary-text-color)',
  primaryDarkerColor: 'var(--primary-darker-color)',
  primaryDarkerTextColor: 'var(--primary-darker-text-color)',
  primaryLighterColor: 'var(--primary-lighter-color)',
  primaryLighterTextColor: 'var(--primary-lighter-text-color)',
  warningColor: 'var(--warning-color)',
  errorColor: 'var(--error-color)',
};
export const primary = css({
  backgroundColor: themeVar.primaryColor,
  color: themeVar.primaryTextColor,
});
export const primaryDark = css({
  backgroundColor: themeVar.primaryDarkerColor,
  color: themeVar.primaryDarkerTextColor,
});
export const primaryLight = css({
  backgroundColor: themeVar.primaryLighterColor,
  color: themeVar.primaryLighterTextColor,
});

export class Theme extends React.PureComponent<ThemeProps> {
  static defaultProps: Partial<ThemeProps> = {
    backgroundColor: 'white',
    primaryColor: 'blue',
    lightTextColor: 'white',
    darkTextColor: '#222',
    warningColor: '#ff9d00',
    errorColor: 'red',
  };
  render() {
    const {
      children,
      backgroundColor,
      primaryColor,
      lightTextColor,
      darkTextColor,
      warningColor,
      errorColor,
    } = this.props;
    const bgColor = Color(backgroundColor);
    const textColor = bgColor.isLight() ? darkTextColor : lightTextColor;
    const primary = Color(primaryColor);
    const primText = primary.isLight() ? darkTextColor : lightTextColor;
    const primDark = primary.darken(0.3);
    const primDarkText = primDark.isLight() ? darkTextColor : lightTextColor;
    const primLight = primary.lighten(0.3);
    const primLightText = primLight.isLight() ? darkTextColor : lightTextColor;

    return (
      <div
        className={css({
          width: 'inherit',
          height: 'inherit',
          backgroundColor: backgroundColor,
          color: textColor,
          '--primary-color': primaryColor,
          '--primary-text-color': primText,
          '--primary-darker-color': primDark.string(),
          '--primary-darker-text-color': primDarkText,
          '--primary-lighter-color': primLight.string(),
          '--primary-lighter-text-color': primLightText,
          '--warning-color': warningColor,
          '--error-color': errorColor,
        })}
      >
        {children}
      </div>
    );
  }
}
