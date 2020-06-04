import * as React from 'react';
import { Toolbar } from './Toolbar';
import { css, cx } from 'emotion';
import { themeVar } from './Style/ThemeVars';

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
        <Toolbar.Header>
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
        <Toolbar.Content>
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
const tabStyle = css({
  display: 'inline-block',
  cursor: 'pointer',
  margin: '0 0.2em',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 1px',
  padding: '5px',
});
export const inactiveTabStyle = css({
  color: themeVar.TabLayout.colors.TabTextColor,
  backgroundColor: themeVar.TabLayout.colors.TabColor,
});
export const activeTabStyle = css({
  color: themeVar.TabLayout.colors.TabTextColor,
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
