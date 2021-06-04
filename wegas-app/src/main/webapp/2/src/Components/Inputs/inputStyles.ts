import { css, ObjectInterpolation } from 'emotion';
import { themeVar } from '../Theme/ThemeVars';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.6em',
};

export const inputStyleCSS: ObjectInterpolation<undefined> = {
  ...inputDefaultCSS,
  resize: 'vertical',
  borderStyle: 'inset',
  borderColor: themeVar.colors.PrimaryColor,
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: themeVar.colors.BackgroundColor,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    color: themeVar.colors.DarkTextColor,
    backgroundColor: themeVar.colors.DisabledColor,
  },
};

export const inputStyle = css(inputStyleCSS);
