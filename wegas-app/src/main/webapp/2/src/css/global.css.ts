/*
KEEP THIS FILE MINIMAL !!!
*/
import { injectGlobal } from 'emotion';

injectGlobal`
  html {
    font-size: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
      'Segoe UI Symbol';
    line-height: 1.15;
    box-sizing: border-box;
  }
  *,
  ::after,
  ::before {
    box-sizing: inherit;
  }
  html,
  body,
  #root {
    margin: 0;
    height: 100%;
  }

  /* reset */
  input,
  textarea,
  select,
  button {
    font-family: initial;
    font-size: initial;
    line-height: initial;
    padding: 2px 4px;
  }
`;
