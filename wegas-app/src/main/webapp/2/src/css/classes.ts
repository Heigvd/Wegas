//import * as Color from 'color';
import { css, cx } from 'emotion';
import { themeVar } from '../Components/Style/ThemeVars';

// Display
export const flex = css({
  display: 'flex',
});
export const block = css({
  display: 'block',
});
export const hidden = css({
  display: 'none',
});
export const hiddenImportant = css({
  display: 'none !important',
});

// Layout constraints
export const relative = css({
  position: 'relative',
});
export const absoute = css({
  position: 'absolute',
});

// Scroll
export const noOverflow = css({
  overflow: 'unset',
});
export const autoScroll = css({
  overflow: 'auto',
});
export const forceScroll = css({
  overflow: 'scroll',
});
export const hideOverflow = css({
  overflow: 'hidden',
});
export const showOverflow = css({
  overflow: 'visible',
});

// Size
export const expandBoth = css({
  width: '100%',
  height: '100%',
});
export const expandWidth = css({
  width: '100%',
});
export const expandHeight = css({
  height: '100%',
});
export const shrinkBoth = css({
  width: 'fit-content',
  height: 'fit-content',
});
export const shrinkWidth = css({
  width: 'fit-content',
});
export const shrinkHeight = css({
  height: 'fit-content',
});

// Flex
export const grow = css({
  flex: '1 1 auto',
});
export const flexColumn = css({
  flexDirection: 'column',
});
export const flexRow = css({
  flexDirection: 'row',
});
export const flexWrap = css({
  flexWrap: 'wrap',
});
export const flexDistribute = css({
  justifyContent: 'space-evenly',
});

// Position
export const textCenter = css({
  textAlign: 'center',
});
export const itemCenter = css({
  alignItems: 'center',
});
export const contentCenter = css({
  alignContent: 'center',
});
export const justifyCenter = css({
  justifyContent: 'center',
});
export const foregroundContent = css({
  zIndex: 1000,
});

/* Spaces */
export const defaultMarginLeft = css({
  marginLeft: '10px',
});

export const defaultMarginRight = css({
  marginRight: '10px',
});

export const defaultMarginTop = css({
  marginTop: '10px',
});

export const defaultMarginBottom = css({
  marginTop: '10px',
});

export const defaultMargin = cx(
  defaultMarginTop,
  defaultMarginRight,
  defaultMarginBottom,
  defaultMarginLeft,
);

export const defaultPaddingLeft = css({
  paddingLeft: '10px',
});

export const defaultPaddingRight = css({
  paddingRight: '10px',
});

export const defaultPaddingTop = css({
  paddingTop: '10px',
});

export const defaultPaddingBottom = css({
  paddingTop: '10px',
});

export const defaultPadding = cx(
  defaultPaddingTop,
  defaultPaddingRight,
  defaultPaddingBottom,
  defaultPaddingLeft,
);

// Components
export const button = css({
  color: themeVar.Common.colors.TextColor,
  ':hover,:focus': {
    color: themeVar.Common.colors.HoverColor,
    outline: 'none',
  },
});

// Editor
export const localSelection = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
});
export const globalSelection = css({
  //  borderStyle: 'solid',
  //  borderWidth: '2px',
  //  borderColor: themeVar.Common.colors.BorderColor,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  boxShadow: `0px 0px 0px 1px ${themeVar.Common.colors.BorderColor}`,
});
export const searchSelection = css({
  backgroundColor: themeVar.Common.colors.HighlightColor,
});

// Layout base styles
export const layoutStyle = css({
  color: themeVar.Common.colors.TextColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  fontFamily: themeVar.Common.others.TextFont1,
});
export const headerStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
});
export const contentStyle = css({
  margin: '5px',
  // backgroundColor: themeVar.Common.colors.BackgroundColor,
});

export const hoverColorInsetShadow = css({
  boxShadow: 'inset 0 0 0 2px var(--common-colors-hovercolor)',
});

export const thinHoverColorInsetShadow = css({
  boxShadow: 'inset 0 0 0 1px var(--common-colors-hovercolor)',
});

export const highlightColorInsetShadow = css({
  boxShadow: 'inset 0 0 0 2px var(--common-colors-highlightcolor)',
});

export const hatchedBackground = css({
  background:
    'repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 10px, var(--common-colors-hovercolor) 10px,  var(--common-colors-hovercolor) 20px);',
  zIndex: 1000,
});

export const thinHatchedBackground = css({
  background:
    'repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 5px, var(--common-colors-hovercolor) 5px,  var(--common-colors-hovercolor) 10px);',
  zIndex: 1000,
});

export const highlightedHatchedBackground = css({
  background:
    //`repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 10px, ${Color(themeVar.Common.colors.HoverColor).darken(0.5).toString()} 10px, ${Color(themeVar.Common.colors.HoverColor).darken(0.5).toString()} 20px);`,
    `repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 10px, var(--common-colors-highlightcolor) 10px, var(--common-colors-highlightcolor) 20px);`,
  zIndex: 1000,
});
