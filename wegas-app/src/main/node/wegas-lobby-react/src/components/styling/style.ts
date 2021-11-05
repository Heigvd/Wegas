/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, CSSObject, cx, keyframes } from '@emotion/css';
import { dangerColor, successColor, warningColor, white } from './color';

type SelectTypeKeys =
  | 'container'
  | 'control'
  | 'placeholder'
  | 'valueContainer'
  | 'option'
  | 'singleValue'
  | 'menu';

type SelectStylesType = Record<SelectTypeKeys, (provided: CSSObject) => CSSObject>;

const min600 = `@media (min-width: 600px)`;

export const defaultSelectStyles: SelectStylesType = {
  container: provided => ({
    ...provided,
    fontSize: '10pt',
  }),
  singleValue: provided => ({
    ...provided,
    color: 'var(--fgColor)',
  }),
  control: provided => ({
    ...provided,
    //    lineHeight: "40px",
    height: '50px',
    marginTop: '2px',
  }),
  placeholder: provided => ({
    ...provided,
    color: 'silver',
  }),
  valueContainer: provided => ({
    ...provided,
    padding: '0 20px',
  }),
  option: provided => ({
    ...provided,
    fontSize: 'unset',
  }),
  menu: provided => ({
    ...provided,
    marginTop: 0,
  }),
};

export const pictoColours = css({
  '--pictoBlue': '#50BFD5', // main blue
  '--pictoOrange': '#E36D28', // main orange
  '--pictoYellow': '#FFE527', // main yellow
  '--pictoLightBlue': '#8CE9FB', // blue-yellow intersection
  '--pictoPeach': '#FCC08B', // yellow-orange intersection
  '--pictoSteelBlue': '#68A8C3', // blue-orange intersection
  '--pictoGrey': '#9AA4B1', // center colour
  '--errorColor': dangerColor.toString(),
  '--warningColor': warningColor.toString(),
  '--successColor': successColor.toString(),
  '--blueColor': '#41d2fa',
});

export const darkModeColors = css({
  '--bgColor': '#666',
  '--fgColor': white.toString(),
  '--disabledFgColor': white.clone().darken(10).toString(),
  '--secBgColor': '#666',
  '--secFgColor': white.toString(),
  '--hoverBgColor': '#404040',
  '--hoverFgColor': white.toString(),
  '--linkColor': 'white',
  '--linkHoverColor': white.toString(),
  '--linkHoverBgColor': '#404040',
  '--focusColor': 'var(--pictoSteelBlue)',
});

export const darkMode = cx(
  darkModeColors,
  css({
    backgroundColor: 'var(--bgColor)',
    color: 'var(--fgColor)',
    '& a': {
      color: 'var(--linkColor)',
    },
  }),
);

export const semiDarkModeColors = css({
  '--bgColor': '#d7d7d7',
  '--fgColor': '#333',
  '--disabledFgColor': '#222',
  '--secBgColor': '#d7d7d7',
  '--segBgColor': '#333',
  '--hoverBgColor': '#FFF0',
  '--hoverFgColor': '#999',
  '--linkColor': 'var(--pictoSteelBlue)',
  '--linkHoverColor': 'var(--pictoBlue)',
  '--linkHoverBgColor': '#FFF0',
  '--focusColor': 'var(--pictoSteelBlue)',
});

export const semiDarkMode = cx(
  semiDarkModeColors,
  css({
    backgroundColor: 'var(--bgColor)',
    color: 'var(--fgColor)',
    '& a': {
      color: 'var(--linkColor)',
    },
  }),
);

export const melonColors = css({
  '--bgColor': '#FB8160',
  '--fgColor': white.toString(),
  '--disabledFgColor': white.clone().darken(10).toString(),
  '--secBgColor': '#FEFEFE',
  '--secFgColor': '#666',
  '--hoverBgColor': '#404040',
  '--hoverFgColor': white.toString(),
  '--linkColor': 'white',
  '--linkHoverColor': white.toString(),
  '--linkHoverBgColor': '#FB8160',
  '--focusColor': 'var(--pictoSteelBlue)',
  '--warningColor': white.toString(),
});

export const melonMode = cx(
  melonColors,
  css({
    backgroundColor: 'var(--bgColor)',
    color: 'var(--fgColor)',
    '& a': {
      color: 'var(--linkColor)',
    },
  }),
);

export const lightModeColors = css({
  '--bgColor': '#FEFEFE',
  '--fgColor': '#666',
  '--disabledFgColor': '#999',
  '--secBgColor': '#FEFEFE',
  '--secFgColor': '#666',
  '--hoverBgColor': '#FFF0',
  '--hoverFgColor': '#999',
  '--linkColor': 'var(--fgColor)',
  '--linkHoverColor': 'var(--fgColor)',
  '--linkHoverBgColor': '#e6e6e6',
  '--focusColor': 'var(--pictoSteelBlue)',
});

export const lightMode = cx(
  lightModeColors,
  css({
    backgroundColor: 'var(--bgColor)',
    color: 'var(--fgColor)',
    '& a': {
      color: 'var(--linkColor)',
    },
  }),
);

export const semiLightModeColors = cx(
  lightModeColors,
  css({
    '--bgColor': '#F0F0F0',
  }),
);

export const semiLightMode = cx(
  semiLightModeColors,
  css({
    backgroundColor: 'var(--bgColor)',
    color: 'var(--fgColor)',
  }),
);

export const fullPageStyle = cx(
  pictoColours,
  lightMode,
  css({
    backgroundColor: '#F9F9F9',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    //    '& :focus': {
    //      outline: 'var(--focusColor) auto 1px',
    //    },
  }),
);

export const fullPageOverlayStyle = cx(
  fullPageStyle,
  css({
    backgroundColor: '#dfdfdfdf',
  }),
);

export const fullWidthBanner = css({
  width: '100%',
  padding: '10px',
  fontSize: '1.3em',
  fontWeight: 300,
  textAlign: 'center',
});

export const fullWidthWarningBanner = cx(
  fullWidthBanner,
  css({
    color: white.toString(),
    backgroundColor: 'var(--warningColor)',
  }),
);

const pulseKeyframes = keyframes`
  0% {
   transform: rotate(0deg);
  }
  33% {
    transform: rotate(240deg);
  }
  66% {
    transform: rotate(480deg);
  }
  100% {
    transform: rotate(720deg);
  }
`;

export const pulseLinear = css`
  animation: ${pulseKeyframes} 3s linear 10;
`;

export const pulseEase = css`
  animation: ${pulseKeyframes} 2s ease 10;
`;

export const linkStyle = css({
  color: 'var(--linkColor)',
  textDecorationLine: 'none',
  cursor: 'pointer',
  ':hover': {
    color: 'var(--hoverFgColor)',
    backgroundColor: 'var(--hoverBgColor)',
  },
});

export const iconStyle = css({
  paddingLeft: '5px',
  paddingRight: '5px',
});

export const iconButton = cx(linkStyle, iconStyle);

export const inactiveButtonStyle = cx(
  darkMode,
  css({
    margin: '10px',
    textTransform: 'uppercase',
    fontSize: '12px',
    backgroundColor: '#666',
    opacity: '0.5',
    padding: '18px 24px',
  }),
);

export const buttonStyle = cx(
  inactiveButtonStyle,
  css({
    cursor: 'pointer',
    opacity: '1',
    transition: 'all .5s ease',
    ':hover': {
      color: 'var(--hoverFgColor)',
      backgroundColor: 'var(--hoverBgColor)',
    },
    '& a': {
      textDecoration: 'none',
      color: 'var(--fgColor)',
    },
  }),
);

export const mainButtonStyle = cx(
  buttonStyle,
  css({
    color: white.toString(),
    backgroundColor: '#4caf50',
    ':hover': {
      color: white.toString(),
      backgroundColor: '#357a38',
    },
    ':focus': {
      color: white.toString(),
      backgroundColor: '#357a38',
    },
  }),
);

export const secButtonStyle = cx(
  buttonStyle,
  css({
    color: white.toString(),
    backgroundColor: '#41d2fa',
    ':hover': {
      color: white.toString(),
      backgroundColor: '#06b7e8',
    },
    ':focus': {
      color: white.toString(),
      backgroundColor: '#06b7e8',
    },
  }),
);

export const disabledIconStyle = iconStyle;

export const cardShadow = '0px 1px 3px rgba(0, 0, 0, 0.12)';
export const cardShadowHover = '0 3px 6px rgba(0,0,0,.16)';

export const cardFooterPadding = css({
  padding: '10px 5px 20px 5px',
});

export const cardContainerStyle = css({
  margin: '10px',
  padding: '5px',
});

export const cardStyle = cx(
  lightMode,
  css({
    width: '100%',
    display: 'flex',
    backgroundColor: 'var(--bgColor)',
    margin: '6px auto',
    border: `none`,
    borderRadius: `2px`,
    boxShadow: cardShadow,
    alignItems: 'center',
    ':hover': {
      boxShadow: cardShadowHover,
    },
  }),
);

export const cardTitleStyle = css({
  fontSize: '15px',
  fontWeight: 450,
});

export const cardDetailsStyle = css({
  fontSize: '13px',
  fontWeight: 300,
});

export const cardSubDetailsStyle = css({
  fontSize: '13px',
  fontWeight: 300,
  fontStyle: 'italic',
});

export const textareaStyle = css({
  outline: 'none',
  border: 'solid 1px #d7d7d7',
  color: 'var(--secFgColor)',
  backgroundColor: 'var(--secBgColor)',
  borderRadius: '6px',
  boxSizing: 'border-box',
  //  margin: "2px 2px 2px 8px",
  transition: '.8s',
  padding: '0 24px',
  lineHeight: '24px',
  height: '144px',
});

export const inputStyle = css({
  outline: 'none',
  border: 'solid 1px #d7d7d7',
  color: 'var(--secFgColor)',
  backgroundColor: 'var(--secBgColor)',
  borderRadius: '6px',
  boxSizing: 'border-box',
  //  margin: "2px 2px 2px 8px",
  transition: '.8s',
  padding: '0 24px',
  lineHeight: '48px',
});

export const smallInputStyle = cx(
  inputStyle,
  css({
    padding: '0 24px',
    lineHeight: '24px',
    borderRadius: '12px',
  }),
);

export const panelPadding = css({
  [min600]: {
    padding: '0 48px 20px 48px',
  },
});

export const warningStyle = css({
  color: 'var(--warningColor)',
});

export const errorStyle = css({
  color: 'var(--dangerColor)',
});

export const labelStyle = css({
  fontWeight: 500,
  '&::first-letter': {
    textTransform: 'capitalize',
  },
});

export const mainHeaderHeight = '48px';
