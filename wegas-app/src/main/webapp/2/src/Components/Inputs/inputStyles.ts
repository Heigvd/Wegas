import { css } from 'emotion';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.6em',
};

export const inputStyle = css({
  ...inputDefaultCSS,
  width: '100%',
  resize: 'vertical',
  border: 'thin solid',
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
    backgroundColor: 'lightgrey',
  },
});
