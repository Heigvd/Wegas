import * as React from 'react';
import { Toolbar } from './Toolbar';
import { css, cx } from 'emotion';
import { themeVar } from './Style/ThemeVars';

export const tabLayoutHeaderStyle = css({
  backgroundColor: themeVar.Layout.colors.HeaderBackgroundColor,
});
export const tabLayoutContentStyle = css({
  margin: '5px',
  backgroundColor: themeVar.Layout.colors.BackgroundColor,
});

interface TabLayoutProps {
  active?: number;
  vertical: boolean;
  tabs: (React.ReactChild | null)[];
}
export class TabLayout extends React.Component<
  TabLayoutProps,
  { active: number; renderedFlag: number }
> {
  static defaultProps = {
    vertical: false,
  };
  readonly state = {
    active: this.props.active || 0,
    renderedFlag: this.props.active || 0,
  };

  render() {
    return (
      <Toolbar vertical={this.props.vertical}>
        <Toolbar.Header className={tabLayoutHeaderStyle}>
          {this.props.tabs.map((t, i) => {
            return (
              <Tab
                key={i}
                active={i === this.state.active}
                onClick={() =>
                  this.setState(oldState => {
                    return {
                      active: i,
                      renderedFlag: oldState.renderedFlag | (i + 1),
                    };
                  })
                }
              >
                {t}
              </Tab>
            );
          })}
        </Toolbar.Header>
        <Toolbar.Content className={tabLayoutContentStyle}>
          {React.Children.map(this.props.children, (c, i) => {
            return (
              (i === this.state.active ||
                (this.state.renderedFlag & (i + 1)) > 0) && (
                <div
                  style={{
                    display: i === this.state.active ? 'flex' : 'none',
                    flex: '1 1 auto',
                  }}
                >
                  {c}
                </div>
              )
            );
          })}
        </Toolbar.Content>
      </Toolbar>
    );
  }
}
export const tabStyle = css({
  display: 'inline-block',
  cursor: 'pointer',
  margin: '0 5px',
  padding: '5px',
});
export const inactiveTabStyle = css({
  color: themeVar.TabLayout.colors.TabTextColor,
  backgroundColor: themeVar.TabLayout.colors.TabColor,
});
export const activeTabStyle = css({
  color: themeVar.TabLayout.colors.ActiveTabTextColor,
  backgroundColor: themeVar.TabLayout.colors.ActiveTabColor,
});
function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  children: React.ReactChild | null;
  onClick: () => void;
}) {
  if (children === null) {
    return null;
  }
  return (
    <div
      className={cx(tabStyle, {
        [activeTabStyle]: active,
        [inactiveTabStyle]: !active,
      })}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
