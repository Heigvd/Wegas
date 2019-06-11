import * as React from 'react';
import { css } from 'emotion';
import * as Color from 'color';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';

interface ThemeProps {
  backgroundColor: string;
  primaryColor: string;
  lightTextColor: string;
  darkTextColor: string;
  warningColor: string;
  errorColor: string;
  successColor: string;
  disabledColor: string;
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
  successColor: 'var(--success-color)',
  disabledColor: 'var(--disabled-color)',
  backgroundColor: 'var(--background-color)',
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

const { Consumer, Provider } = React.createContext<HTMLElement | null>(
  document.body,
);
export class Theme extends React.PureComponent<
  ThemeProps,
  { root: HTMLElement | null }
> {
  static defaultProps = {
    backgroundColor: 'white',
    primaryColor: '#1565C0',
    lightTextColor: 'white',
    darkTextColor: '#222',
    warningColor: '#ff9d00',
    errorColor: 'red',
    successColor: '#25f325',
    disabledColor: 'lightgrey',
  };

  readonly state: Readonly<{ root: HTMLElement | null }> = {
    root: null,
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
      successColor,
      disabledColor,
    } = this.props;
    const bgColor = Color(backgroundColor);
    const textColor = bgColor.isLight() ? darkTextColor : lightTextColor;
    const primary = Color(primaryColor);
    const primText = primary.isLight() ? darkTextColor : lightTextColor;
    const primDark = primary.darken(0.33);
    const primDarkText = primDark.isLight() ? darkTextColor : lightTextColor;
    const primLight = primary.lighten(0.33);
    const primLightText = primLight.isLight() ? darkTextColor : lightTextColor;
    return (
      <div
        ref={n =>
          this.setState({
            root: n,
          })
        }
        className={css({
          display: 'flex',
          width: '100%',
          height: '100%',
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
          '--success-color': successColor,
          '--disabled-color': disabledColor,
          '--background-color': backgroundColor,
        })}
      >
        <Provider value={this.state.root}>{children}</Provider>
      </div>
    );
  }
}
export { Consumer as ThemeRoot };
