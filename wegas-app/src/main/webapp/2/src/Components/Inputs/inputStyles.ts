import { css } from 'emotion';
import { themeVar } from '../Theme';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.6em',
};

export const inputStyle = css({
  ...inputDefaultCSS,
  resize: 'vertical',
  borderStyle: 'thin solid',
  borderRadius: themeVar.borderRadius,
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    backgroundColor: 'lightgrey',
  },
});
