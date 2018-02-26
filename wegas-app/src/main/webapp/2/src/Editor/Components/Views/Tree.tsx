import * as React from 'react';
import { FontAwesome } from './FontAwesome';
import { css } from 'glamor';

interface TreeProps {
  expanded?: boolean;
  header: React.ReactNode;
  children?: React.ReactNode;
}
const indent = css({
  paddingLeft: '1em',
});
const toggle = css({
  padding: '0 0.3em',
  width: '1em',
  display: 'inline-block',
  cursor: 'pointer',
});
const emptyMessageCss = css(
  {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  indent,
);
function EmptyMessage() {
  return <span {...emptyMessageCss}>empty</span>;
}
export class Tree extends React.Component<TreeProps, { expanded?: boolean }> {
  constructor(props: TreeProps) {
    super(props);
    this.state = {
      expanded: props.expanded,
    };
    this.toggleExpand = this.toggleExpand.bind(this);
  }
  toggleExpand() {
    this.setState({
      expanded: !this.state.expanded,
    });
  }
  render() {
    const { expanded } = this.state;
    const { children, header } = this.props;
    if (Array.isArray(children)) {
      const c = children.length ? children : <EmptyMessage />;
      return (
        <div>
          <span {...toggle} onClick={this.toggleExpand}>
            <FontAwesome icon={expanded ? 'caret-down' : 'caret-right'} />
          </span>
          {header}
          <div {...indent}>{expanded ? c : null}</div>
        </div>
      );
    }
    return (
      <div>
        <span {...toggle} />
        {header}
      </div>
    );
  }
}
