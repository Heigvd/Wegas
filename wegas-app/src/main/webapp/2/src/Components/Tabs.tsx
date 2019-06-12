import * as React from 'react';
import { Toolbar } from './Toolbar';
import { css } from 'emotion';
import { primaryLight, primaryDark } from './Theme';

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
    const childrens = React.Children.map(this.props.children, (c, i) => {
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
    });
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
        <Toolbar.Content>{childrens}</Toolbar.Content>
      </Toolbar>
    );
  }
}
const tabStyle = css(primaryLight, {
  display: 'inline-block',
  cursor: 'pointer',

  margin: '0 0.2em',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 1px',
  padding: '5px',
  // '&:hover': primary,
});
const activeTabStyle = css(tabStyle, primaryDark);
function Tab(props: {
  active: boolean;
  children: React.ReactChild | null;
  onClick: () => void;
}) {
  if (props.children === null) {
    return null;
  }
  return (
    <div
      className={`${props.active ? activeTabStyle : tabStyle}`}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}
