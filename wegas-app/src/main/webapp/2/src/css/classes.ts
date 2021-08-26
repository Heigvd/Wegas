//import * as Color from 'color';
import { css, cx } from 'emotion';
import { themeVar } from '../Components/Theme/ThemeVars';

// Display
export const flex = css({
  display: 'flex',
});
export const inlineFlex = css({
  display: 'inline-flex',
});
export const grid = css({
  display: 'grid',
});
export const block = css({
  display: 'block',
});
export const inlineBlock = css({
  display: 'inline-block',
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
export const absolute = css({
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

export const hideWithEllipsis = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
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
export const stretch = css({
  alignItems: 'stretch',
});
export const flexColumn = css({
  flexDirection: 'column',
});
export const flexRow = css({
  flexDirection: 'row',
});
export const flexRowReverse = css({
  flexDirection: 'row-reverse',
  width: 'fit-content',
});
export const flexWrap = css({
  flexWrap: 'wrap',
});

// Position
export const textCenter = css({
  textAlign: 'center',
});
export const itemCenter = css({
  alignItems: 'center',
});
export const itemBottom = css({
  alignItems: 'flex-end',
});
export const itemsTop = css({
  alignItems: 'flex-start',
});
export const itemStretch = css({
  alignItems: 'stretch',
});
export const contentCenter = css({
  alignContent: 'center',
});
export const justifyCenter = css({
  justifyContent: 'center',
});
export const justifyEnd = css({
  justifyContent: 'flex-end',
});
export const justifyStart = css({
  justifyContent: 'flex-start',
});
export const flexDistribute = css({
  justifyContent: 'space-evenly',
});
export const flexBetween = css({
  justifyContent: 'space-between',
});
export const foregroundContent = css({
  zIndex: 1000,
});

/* Spaces */
export const componentMarginLeft = css({
  marginLeft: '5px',
});

export const componentMarginRight = css({
  marginRight: '5px',
});

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
  marginBottom: '10px',
});

export const defaultMargin = cx(
  defaultMarginTop,
  defaultMarginRight,
  defaultMarginBottom,
  defaultMarginLeft,
);

export const autoMargin = css({ margin: 'auto' });
export const XLPadding = css({
  padding: '2em',
});
export const MediumPadding = css({
  padding: '1.5em',
});
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
  paddingBottom: '10px',
});

export const defaultPadding = cx(
  defaultPaddingTop,
  defaultPaddingRight,
  defaultPaddingBottom,
  defaultPaddingLeft,
);

// Components
export const button = css({
  color: themeVar.colors.DarkTextColor,
  ':hover,:focus': {
    color: themeVar.colors.HoverColor,
    outline: 'none',
  },
});

// Editor
export const localSelection = css({
  border: '1px dashed ' + themeVar.colors.PrimaryColor,
});
export const globalSelection = css({
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: themeVar.colors.HeaderColor,
});
export const searchSelection = css({
  border: '1px solid ' + themeVar.colors.HighlightColor,
});

// Layout base styles
export const layoutStyle = css({
  color: themeVar.colors.DarkTextColor,
  backgroundColor: themeVar.colors.BackgroundColor,
  fontFamily: themeVar.others.TextFont2,
});
export const headerStyle = css({
  backgroundColor: themeVar.colors.SecondaryBackgroundColor,
  borderBottom: '15px solid ' + themeVar.colors.ActiveColor,
});

export const contentStyle = css({
  margin: '5px',
});

export const childrenHeaderStyle = css({
  backgroundColor: themeVar.colors.ActiveColor,
  padding: '0 1em',
});

export const toolboxHeaderStyle = css({
  marginBottom: '10px',
  paddingBottom: '10px',
  borderBottom: '1px solid ' + themeVar.colors.DisabledColor,
});

export const disabledColorStyle = css({
  color: themeVar.colors.DisabledColor,
});
export const halfOpacity = css({
  opacity: 0.5,
});

export const infoShortTextStyle = css({
  color: '#AAAAAA', // TODO add in Theme
});

export const hoverColorInsetShadow = css({
  boxShadow: 'inset 0 0 0 2px var(--colors-hovercolor)',
});

export const thinHoverColorInsetShadow = css({
  boxShadow: 'inset 0 0 0 1px var(--colors-hovercolor)',
});

export const highlightColorInsetShadow = css({
  boxShadow: 'inset 0 0 0 2px var(--colors-highlightcolor)',
});

export const hatchedBackground = css({
  background:
    'repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 10px, var(--colors-hovercolor) 10px,  var(--colors-hovercolor) 20px);',
  zIndex: 1000,
});

export const insideInsetShadow = css({
  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)',
});

export const thinHatchedBackground = css({
  background:
    'repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 5px, var(--colors-hovercolor) 5px,  var(--colors-hovercolor) 10px);',
  zIndex: 1000,
});

export const highlightedHatchedBackground = css({
  background:
    //`repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 10px, ${Color(themeVar.colors.HoverColor).darken(0.5).toString()} 10px, ${Color(themeVar.colors.HoverColor).darken(0.5).toString()} 20px);`,
    `repeating-Linear-gradient( 45deg, #ffffff80, #ffffff80 10px, var(--colors-highlightcolor) 10px, var(--colors-highlightcolor) 20px);`,
  zIndex: 1000,
});

export const dropZoneStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.colors.HighlightColor,
});

export const unreadSignalStyle = css({
  '::before': {
    content: '"New"',
    transform: 'rotate(-90deg)',
    position: 'absolute',
    fontSize: '10pt',
    fontWeight: 'bold',
    color: 'orange',
  },
});

export const unreadSpaceStyle = css({
  minWidth: '30px',
  display: 'flex',
  alignItems: 'center',
});

// Others

export const pointer = css({
  cursor: 'pointer',
});
