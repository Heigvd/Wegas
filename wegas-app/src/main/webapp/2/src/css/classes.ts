import { css, cx } from 'emotion';
import { themeVar } from '../Components/Theme';

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
export const centeredContent = css({
  display: 'flex',
  justifyContent: 'center',
});
export const foregroundContent = css({
  zIndex: 1000,
});

/* Paddings */
export const defaultPaddingLeft = css({
  marginLeft: '10px',
});

export const defaultPaddingRight = css({
  marginRight: '10px',
});

export const defaultPaddingTop = css({
  marginTop: '10px',
});

export const defaultPaddingBottom = css({
  marginTop: '10px',
});

export const defaultPadding = cx(
  defaultPaddingTop,
  defaultPaddingRight,
  defaultPaddingBottom,
  defaultPaddingLeft,
);

// Components
export const button = css({
  color: themeVar.primaryLighterTextColor,
  ':hover,:focus': {
    color: themeVar.primaryHoverColor,
    outline: 'none',
  },
});
