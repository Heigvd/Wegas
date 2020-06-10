import { css } from 'emotion';
import { themeVar } from '../Style/ThemeVars';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.6em',
};

export const inputStyle = css({
  ...inputDefaultCSS,
  resize: 'vertical',
  borderStyle: 'thin solid',
  borderColor: themeVar.Common.colors.BorderColor,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    color: themeVar.Common.colors.HoverTextColor,
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
});
