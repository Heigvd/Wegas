import { css, CSSObject } from '@emotion/css';
import { themeVar } from '../Theme/ThemeVars';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.6em',
};

export const inputStyleCSS: CSSObject = {
  ...inputDefaultCSS,
  resize: 'vertical',
  borderColor: themeVar.colors.PrimaryColor,
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: themeVar.colors.BackgroundColor,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[disabled]': {
    backgroundColor: themeVar.colors.DisabledColor,
  },
  '&[readonly]': {
    color: themeVar.colors.DisabledColor,
  },
};

export const inputStyle = css(inputStyleCSS);
