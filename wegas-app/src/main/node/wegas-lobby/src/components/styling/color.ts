import tinycolor from 'tinycolor2';

// -- Colors ---
export const white = tinycolor('#fefefe');
export const primaryColor = tinycolor('#FA6942');
export const primaryColorLight = tinycolor('#FF7752');
export const primaryColorDark = primaryColor.clone().darken(10);
export const secondaryColor = tinycolor('#41D2FA');
export const secondaryColorLight = tinycolor('#AFEAFA');
export const secondaryColorDark = tinycolor('#38B6D9');

// -- Background ---
export const backgroundDefault = tinycolor('#f0f0f0');
export const backgroundDefaultSecondary = tinycolor('#F9F9F9');
export const backgroundWhite = white;
export const albasimColor = tinycolor('#a68f81');

export const backgroundReverse = primaryColor;
export const backgroundReverseLight = primaryColorLight;

// -- Text ---
export const defaultColor = tinycolor('#272727');
export const defaultColorButton = tinycolor('#666666');
export const defaultColorLight = tinycolor('#BCBCBC');

// -- Borders --
export const border = tinycolor('#d7d7d7');
export const borderReverse = primaryColorDark;

// -- Infos ---
export const dangerColor = tinycolor('#e51c23');
export const successColor = tinycolor('#4caf50');
export const warningColor = tinycolor('#ff9800');

export const orange = tinycolor('#FF9369');
export const orangine = tinycolor('#FFB93C');
export const greenyellow = tinycolor('#AAFF5F');
export const bluepurple = tinycolor('#ADA8FF');
export const wine = tinycolor('#B0747A');
export const ocean = tinycolor('#90ACFF');
export const greenblue = tinycolor('#6BB28A');
export const blue = tinycolor('#A2E0F2');
export const brown = tinycolor('#B2957C');
export const red = tinycolor('#FF5E5E');
export const yellow = tinycolor('#EDE466');
export const purple = tinycolor('#DFB2FF');
export const pink = tinycolor('#FF96D2');
export const green = tinycolor('#BEED79');
export const grey = tinycolor('#AEAAB2');

export const illustrationColors = {
  'white-orange': orange.clone().lighten(10),
  'light-orange': orange.clone().lighten(6),
  orange: orange,
  'dark-orange': orange.clone().darken(10),
  'black-orange': orange.clone().darken(20),

  'white-red': red.clone().lighten(10),
  'light-red': red.clone().lighten(6),
  red,
  'dark-red': red.clone().darken(10),
  'black-red': red.clone().darken(20),

  'white-bluepurple': bluepurple.clone().lighten(10),
  'light-bluepurple': bluepurple.clone().lighten(6),
  bluepurple,
  'dark-bluepurple': bluepurple.clone().darken(10),
  'black-bluepurple': bluepurple.clone().darken(20),

  'white-greenblue': greenblue.clone().lighten(10),
  'light-greenblue': greenblue.clone().lighten(6),
  greenblue,
  'dark-greenblue': greenblue.clone().darken(10),
  'black-greenblue': greenblue.clone().darken(20),

  'white-grey': grey.clone().lighten(10),
  'light-grey': grey.clone().lighten(6),
  grey,
  'dark-grey': grey.clone().darken(10),
  'black-grey': grey.clone().darken(20),

  'white-yellow': yellow.clone().lighten(10),
  'light-yellow': yellow.clone().lighten(6),
  yellow,
  'dark-yellow': yellow.clone().darken(10),
  'black-yellow': yellow.clone().darken(20),

  'white-purple': purple.clone().lighten(10),
  'light-purple': purple.clone().lighten(6),
  purple,
  'dark-purple': purple.clone().darken(10),
  'black-purple': purple.clone().darken(20),

  'white-blue': blue.clone().lighten(10),
  'light-blue': blue.clone().lighten(6),
  blue,
  'dark-blue': blue.clone().darken(10),
  'black-blue': blue.clone().darken(20),

  'white-greenyellow': greenyellow.clone().lighten(10),
  'light-greenyellow': greenyellow.clone().lighten(6),
  greenyellow,
  'dark-greenyellow': greenyellow.clone().darken(10),
  'black-greenyellow': greenyellow.clone().darken(20),

  'white-brown': brown.clone().lighten(10),
  'light-brown': brown.clone().lighten(6),
  brown,
  'dark-brown': brown.clone().darken(10),
  'black-brown': brown.clone().darken(20),

  'white-orangine': orangine.clone().lighten(10),
  'light-orangine': orangine.clone().lighten(6),
  orangine: orangine,
  'dark-orangine': orangine.clone().darken(10),
  'black-orangine': orangine.clone().darken(20),

  'white-pink': pink.clone().lighten(10),
  'light-pink': pink.clone().lighten(6),
  pink,
  'dark-pink': pink.clone().darken(10),
  'black-pink': pink.clone().darken(20),

  'white-ocean': ocean.clone().lighten(10),
  'light-ocean': ocean.clone().lighten(6),
  ocean,
  'dark-ocean': ocean.clone().darken(10),
  'black-ocean': ocean.clone().darken(20),

  'white-green': green.clone().lighten(10),
  'light-green': green.clone().lighten(6),
  green,
  'dark-green': green.clone().darken(10),
  'black-green': green.clone().darken(20),

  'white-wine': wine.clone().lighten(10),
  'light-wine': wine.clone().lighten(6),
  wine,
  'dark-wine': wine.clone().darken(10),
  'black-wine': wine.clone().darken(20),
};

export const playerColor = '#fb8160';
export const trainerColor = '#b4d66b';
export const scenaristColor = '#68caf6';
export const modelerColor = 'palevioletred';
export const adminColor = '#B39DDB';

export type ColorType = keyof typeof illustrationColors;

function isKnown(color: string): color is ColorType {
  return color in illustrationColors;
}

export function resolveColor(color: string): string {
  if (isKnown(color)) {
    const c = illustrationColors[color];
    if (c != null) {
      return c.toString();
    }
  }
  return 'red';
}
