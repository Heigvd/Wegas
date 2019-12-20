import { css } from 'emotion';

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

// Size
export const expand = css({
  width: '100%',
  height: '100%',
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

// Position
export const itemCenter = css({
  alignItems: 'center',
});
export const centeredContent = css({
  justifyContent: 'center',
});
export const foregroundContent = css({
  zIndex: 1000,
});
