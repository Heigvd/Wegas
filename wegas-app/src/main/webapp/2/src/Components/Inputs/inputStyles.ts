import { css } from 'emotion';
import { themeVar } from '../Style/Theme';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.6em',
};

export const inputStyle = css({
  ...inputDefaultCSS,
  resize: 'vertical',
  borderStyle: 'thin solid',
  borderColor: themeVar.primaryLighterColor,
  borderRadius: themeVar.borderRadius,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    backgroundColor: 'lightgrey',
  },
});
