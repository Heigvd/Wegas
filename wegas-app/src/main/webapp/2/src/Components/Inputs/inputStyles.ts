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
  borderColor: themeVar.TextInput.colors.BorderColor,
  borderRadius: themeVar.TextInput.dimensions.BorderRadius,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    backgroundColor: themeVar.TextInput.colors.ReadonlyColor,
  },
});
