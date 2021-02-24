import { css, cx } from 'emotion';
import * as React from 'react';
import { TabProps, Tab } from '../Editor/Components/LinearTabLayout/DnDTabs';

const tabStyle = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  margin: '0 5px',
  padding: '5px',
});

const inactiveTabStyle = css({
  backgroundColor: 'lightgrey',
});
const activeTabStyle = css({
  backgroundColor: 'grey',
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
