import { css, cx } from 'emotion';
import * as React from 'react';
import { TabProps, Tab } from '../../Editor/Components/LinearTabLayout/DnDTabs';
import { trainerTheme } from './HostTheme';

const tabStyle = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  margin: '0 3px',
  padding: trainerTheme.spacing.MediumPadding + " " + trainerTheme.spacing.LargePadding,
  borderRadius: trainerTheme.borders.BorderRadius,
  fontSize: trainerTheme.text.FontSize3,
});

const inactiveTabStyle = css({
  backgroundColor: trainerTheme.colors.InactiveColor,
});
const activeTabStyle = css({
  backgroundColor: trainerTheme.colors.ActiveColor,
  fontWeight: 700,
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
