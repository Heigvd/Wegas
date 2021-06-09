import { css, cx } from 'emotion';
import * as React from 'react';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { TabProps, Tab } from '../../Editor/Components/LinearTabLayout/DnDTabs';

const tabStyle = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  margin: '0 3px',
  padding: '10px 20px',
  borderRadius:
    themeVar.dimensions.BorderRadius +
    ' ' +
    themeVar.dimensions.BorderRadius +
    ' 0 0',
  fontSize: '1em',
});

const inactiveTabStyle = css({
  backgroundColor: themeVar.colors.DisabledColor,
});
const activeTabStyle = css({
  backgroundColor: themeVar.colors.HighlightColor,
  fontWeight: 600,
});

export const OverviewTab = React.forwardRef<HTMLDivElement, TabProps>(
  (props: TabProps, ref: React.RefObject<HTMLDivElement>) => (
    <div
      ref={ref}
      className={
        props.className
          ? props.className
          : cx(tabStyle, {
              [activeTabStyle]: props.active !== undefined && props.active,
              [inactiveTabStyle]: !props.active,
            })
      }
      onClick={props.onClick}
    >
      <React.Suspense fallback={<div>Loading...</div>}>
        {props.children}
      </React.Suspense>
    </div>
  ),
);

Tab.displayName = 'Tab';
