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
  borderColor: themeVar.Common.colors.PrimaryColor,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    color: themeVar.Common.colors.DarkTextColor,
    backgroundColor: themeVar.Common.colors.DisabledColor,
  },
};

export const inputStyle = css(inputStyleCSS);
