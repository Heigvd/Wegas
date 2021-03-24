/*
KEEP THIS FILE MINIMAL !!!
*/
import { injectGlobal } from 'emotion';
const fontUrl = require("./fonts/Raleway-VariableFont_wght.ttf").default;

injectGlobal`
  @font-face {
  font-family: "Raleway";
  src: url("${fontUrl}") format('ttf supports variations'),
       url("${fontUrl}") format('ttf-variations'),
       url("${fontUrl}");
	font-weight: 100 800;
  font-stretch: 25% 151%;
  }
  html {
    font-size: 1em;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
      'Segoe UI Symbol';
    line-height: 1.15em;
    box-sizing: border-box;
    color: #232323;
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
