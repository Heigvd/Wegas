import { css, cx } from '@emotion/css';
import { childrenHeaderStyle } from '../../css/classes';
import { DnDClassNames } from '../../Editor/Components/LinearTabLayout/DnDTabLayout';
import { themeVar } from '../Theme/ThemeVars';

const inactiveTabStyle = css({
  backgroundColor: themeVar.colors.BackgroundColor,
  color: themeVar.colors.ActiveColor,
  height: '52px',
  button: {
    color: themeVar.colors.DisabledColor,
    '&:hover': {
      color: themeVar.colors.ActiveColor,
    },
  },
  '&:hover': {
    backgroundColor: themeVar.colors.HeaderColor,
  },
});

const activeTabStyle = css({
  color: themeVar.colors.LightTextColor,
  backgroundColor: themeVar.colors.ActiveColor,
  boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
  height: '52px',
  button: {
    color: themeVar.colors.LightTextColor,
    '&.wegas.wegas-iconbtn:hover': {
      color: themeVar.colors.DisabledColor,
    },
    '&:focus': {
      color: themeVar.colors.DisabledColor,
    },
  },
});

const childInactiveTabStyle = css({
  backgroundColor: themeVar.colors.ActiveColor,
  border: '1px solid ' + themeVar.colors.LightTextColor,
  borderBottom: '1px solid transparent',
  color: themeVar.colors.LightTextColor,
  textTransform: 'none',
  padding: '6px 10px',
  button: {
    color: themeVar.colors.LightTextColor,
  },
  '&:hover': {
    backgroundColor: themeVar.colors.PrimaryColor,
    border: '1px solid transparent',
  },
  '&:hover .fullscreen-btn': {
    opacity: 0,
    height: '0',
    padding: 0,
  },
});

const childActiveTabStyle = css({
  color: themeVar.colors.ActiveColor,
  backgroundColor: themeVar.colors.BackgroundColor,
  textTransform: 'none',
  padding: '6px 10px',
  button: {
    color: themeVar.colors.DisabledColor,
  },
  '&:hover .fullscreen-btn': {
    opacity: 0,
    height: '0',
    padding: 0,
  },
});

export const plusTabStyle = css({
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  'button.iconOnly': {
    color: themeVar.colors.DisabledColor,
  },
});

const childrenPlusTabStyle = css({
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  'button.wegas.wegas-btn.iconOnly': {
    color: themeVar.colors.LightTextColor,
    '&:hover': {
      color: themeVar.colors.DisabledColor,
    },
  },
});

const tabStyle = css({
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '10px 10px',
  borderRadius:
    themeVar.dimensions.BorderRadius +
    ' ' +
    themeVar.dimensions.BorderRadius +
    ' 0 0',
  textTransform: 'uppercase',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '120%',
  position: 'relative',
  '& .tab-label': {
    padding: '0 10px 0 0',
  },
  '& .close-btn': {
    padding: '0',
  },
  '& .fullscreen-btn': {
    background: themeVar.colors.PrimaryColor,
    borderRadius: themeVar.dimensions.BorderRadius + ' 0 4px 0',
    opacity: 0,
    height: 0,
    padding: 0,
    transition: 'all .5s',
    position: 'absolute',
    top: 0,
    left: 0,
    color: themeVar.colors.LightTextColor,
  },
  '&:hover .fullscreen-btn': {
    opacity: 1,
    height: 'auto',
    padding: '3px',
  },
});

export function tabsStyle(isActive: boolean | undefined) {
  return cx(tabStyle, {
    [activeTabStyle]: isActive,
    [inactiveTabStyle]: !isActive,
  });
}

function childTabsStyle(isActive: boolean | undefined) {
  return cx(tabStyle, {
    [childActiveTabStyle]: isActive,
    [childInactiveTabStyle]: !isActive,
  });
}

export const tabLayoutChildrenClassNames: DnDClassNames = {
  header: childrenHeaderStyle,
  tabsClassName: childTabsStyle,
  plusTabClassName: childrenPlusTabStyle,
};
