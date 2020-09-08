import { css, Interpolation } from 'emotion';
import { themeVar } from '../Style/ThemeVars';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.6em',
};

export const inputStyleCSS: Interpolation = {
  ...inputDefaultCSS,
  resize: 'vertical',
  borderStyle: 'inset',
  borderColor: themeVar.Common.colors.BorderColor,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    color: themeVar.Common.colors.HoverTextColor,
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
};

export const inputStyle = css(inputStyleCSS);
