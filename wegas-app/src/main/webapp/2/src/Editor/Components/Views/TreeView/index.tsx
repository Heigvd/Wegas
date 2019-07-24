import * as React from 'react';
import { DragSource, DragElementWrapper, DragSourceOptions } from 'react-dnd';
import { css, cx } from 'emotion';
import {
  DropZone,
  TREEVIEW_ITEM_TYPE,
  ItemDescription,
  Outcome,
} from './DropZone';
import { FontAwesome } from '../FontAwesome';
import { DefaultDndProvider } from '../../../../Components/DefaultDndProvider';

function noop() {}

interface DropResult {
  id: {};
  source: {
    parent?: {};
    index: number;
  };
  target: {
    parent?: {};
    index: number;
  };
}
interface ContainerProps {
  onDropResult?: (result: DropResult) => void;
  parent?: {};
  children: (passProps: { nodeProps: () => any }) => React.ReactElement<any>;
}
const isOverPrevStyle = css({
  border: '1px dashed',
});
const DropContext = React.createContext<{
  onDropResult: (result: DropResult) => void;
}>({ onDropResult: noop });

class ContextContainer extends React.Component<
  ContainerProps,
  {
    context: { onDropResult: NonNullable<ContainerProps['onDropResult']> };
    oldProps: ContainerProps;
  }
> {
  static getDerivedStateFromProps(
    nextProps: ContainerProps,
    { oldProps }: { oldProps: ContainerProps },
  ) {
    if (oldProps === nextProps) {
      return null;
    }
    return {
      oldProps: nextProps,
      context: { onDropResult: nextProps.onDropResult || noop },
    };
  }
  state = {
    context: { onDropResult: this.props.onDropResult || noop },
    oldProps: this.props,
  };
  render() {
    const { parent } = this.props;
    let index = 0;
    function nodeProps() {
      return { index: index++, parent };
    }
    return (
      <DropContext.Provider value={this.state.context}>
        {this.props.children({ nodeProps })}
      </DropContext.Provider>
    );
  }
}
function DropPreview({
  boundingRect,
}: {
  boundingRect?: DOMRect | ClientRect | undefined;
}) {
  return (
    <div
      className={isOverPrevStyle}
      style={{
        height: boundingRect ? boundingRect.height : undefined,
      }}
    />
  );
}

export function Container(props: ContainerProps) {
  return (
    <DefaultDndProvider>
      <ContextContainer {...props} />
    </DefaultDndProvider>
  );
}

interface NodeProps {
  id: {};
  expanded?: boolean;
  /** Autoset when child of Container */
  parent?: {};
  /** Autoset when child of Container */
  index?: number;
  header: React.ReactNode;
  children: (passProps: { nodeProps: () => any }) => React.ReactChild[] | null;
}
const childrenContainer = css({
  marginLeft: '2em',
  ':empty:after': {
    content: '"empty"',
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
const toggle = css({
  padding: '0 0.3em',
  width: '1em',
  display: 'inline-block',
  cursor: 'pointer',
});
const isDraggingStyle = css({
  display: 'none',
});

interface ConnectedNodeProps extends NodeProps {
  connectDragSource?: DragElementWrapper<DragSourceOptions>;
  onDropResult?: (result: DropResult) => void;
  isDragging?: boolean;
}
class TreeNode extends React.Component<
  ConnectedNodeProps,
  { expanded: boolean }
> {
  root: HTMLDivElement | null = null;
  constructor(props: ConnectedNodeProps) {
    super(props);
    this.state = {
      expanded: Boolean(props.expanded),
    };
    this.toggleExpand = this.toggleExpand.bind(this);
  }
  toggleExpand() {
    this.setState({
      expanded: !this.state.expanded,
    });
  }
  render(): JSX.Element | null {
    const {
      connectDragSource,
      isDragging,
      id,
      parent,
      index,
      header,
    } = this.props;
    const { expanded } = this.state;
    const children = this.props.children({
      nodeProps: (function() {
        let index = 0;
        return function nodeProps() {
          return { index: index++, parent: id };
        };
      })(),
    });
    const isNode = Array.isArray(children);
    const cont = isNode && expanded && (
      <DropZone id={id} where="INSIDE" index={0}>
        {({ isOver, boundingRect }) => (
          <div className={childrenContainer}>
            {isOver && <DropPreview boundingRect={boundingRect} />}
            {children}
          </div>
        )}
      </DropZone>
    );

    return connectDragSource
      ? connectDragSource(
          <div
            ref={n => (this.root = n)}
            className={cx({
              [isDraggingStyle]: isDragging ? isDragging : false,
            })}
          >
            <DropZone id={parent} index={index!} where={'AUTO'}>
              {({ isOver, boundingRect, where, separator }) => (
                <div>
                  {isOver && where === 'BEFORE' && (
                    <DropPreview boundingRect={boundingRect} />
                  )}
                  {separator(
                    <div>
                      <span className={toggle} onClick={this.toggleExpand}>
                        {isNode && (
                          <FontAwesome
                            icon={expanded ? 'caret-down' : 'caret-right'}
                          />
                        )}
                      </span>
                      {header}
                    </div>,
                  )}
                  {cont}
                  {isOver && where === 'AFTER' && (
                    <DropPreview boundingRect={boundingRect} />
                  )}
                </div>
              )}
            </DropZone>
          </div>,
        )
      : null;
  }
}

const DSNode = DragSource<
  NodeProps & { onDropResult: (result: DropResult) => void }
>(
  TREEVIEW_ITEM_TYPE,
  {
    beginDrag(props, _monitor, component: TreeNode): ItemDescription {
      return {
        id: props.id,
        index: props.index!,
        parent: props.parent,
        boundingRect: component.root!.getBoundingClientRect(),
      };
    },
    endDrag(props, monitor) {
      if (monitor != null && monitor.getDropResult() != null) {
        const outcome = (monitor.getDropResult() as Outcome).outcome;
        const result: DropResult = {
          id: props.id,
          source: {
            parent: props.parent,
            index: props.index!,
          },
          target: outcome,
        };
        props.onDropResult(result);
      }
    },
  },
  function(connect, monitor) {
    return {
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging(),
    };
  },
)(TreeNode);

export function Node(props: NodeProps) {
  return (
    <DropContext.Consumer>
      {({ onDropResult }) => {
        return <DSNode {...props} onDropResult={onDropResult} />;
      }}
    </DropContext.Consumer>
  );
}
