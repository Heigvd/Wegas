import * as React from 'react';
import { Toolbar } from './Toolbar';
import { css } from 'emotion';
interface TabLayoutProps {
  active?: number;
  tabs: React.ReactChild[];
}
export class TabLayout extends React.Component<
  TabLayoutProps,
  { active: number }
> {
  readonly state = { active: this.props.active || 0 };
  render() {
    const active = React.Children.map(this.props.children, (c, i) => {
      return i === this.state.active ? c : null;
    });
    return (
      <Toolbar>
        <Toolbar.Header>
          {this.props.tabs.map((t, i) => {
            return (
              <Tab
                key={i}
                active={i === this.state.active}
                onClick={() => this.setState({ active: i })}
              >
                {t}
              </Tab>
            );
          })}
        </Toolbar.Header>
        <Toolbar.Content>{active}</Toolbar.Content>
      </Toolbar>
    );
  }
}
const tabStyle = css({
  display: 'inline-block',
  cursor: 'pointer',
  opacity: 0.5,
  margin: '0 0.2em',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 1px',
  padding: '5px',
  ':hover': {
    opacity: 1,
  },
});
const activeTabStyle = css(tabStyle, {
  opacity: 1,
});
function Tab(props: {
  active: boolean;
  children: React.ReactChild;
  onClick: () => void;
}) {
  return (
    <div
      className={`${props.active ? activeTabStyle : tabStyle}`}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}
