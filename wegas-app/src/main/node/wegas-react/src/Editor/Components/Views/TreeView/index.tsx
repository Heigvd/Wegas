import * as React from 'react';
import {
  DragSource,
  DragElementWrapper,
  DragSourceOptions,
  DropTarget,
} from 'react-dnd';
import { css, cx } from '@emotion/css';
import { DropZoneFactory, ItemDescription, Outcome } from './DropZone';
import { FontAwesome } from '../FontAwesome';
import { DefaultDndProvider } from '../../../../Components/Contexts/DefaultDndProvider';
import {
  flex,
  grow,
  flexRow,
  flexColumn,
  itemCenter,
} from '../../../../css/classes';

const noop = () => undefined;

export interface DropResult<T = {}> {
  id: T;
  source: {
    parent?: T;
    index: number;
  };
  target: {
    parent?: T;
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

interface DragDropProps {
  dragId: Parameters<typeof DragSource>[0];
  dropIds?: Parameters<typeof DropTarget>[0];
  dragDisabled?: boolean;
  dropDisabled?: boolean;
}

interface NodeProps extends DragDropProps {
  id: {};
  expanded?: boolean;
  noToggle?: boolean;
  /** Autoset when child of Container */
  parent?: {};
  /** Autoset when child of Container */
  index?: number;
  header: React.ReactNode;
  children: (passProps: { nodeProps: () => any }) => React.ReactChild[] | null;
  disabled?: boolean;
}
const childrenContainer = css({
  marginLeft: '1em',
  ':empty:after': {
    content: '"empty"',
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
const toggleStyle = css({
  padding: '0 0.3em',
  width: '1em',
  cursor: 'pointer',
});

const noToggleStyle = css({
  padding: '0 0.3em',
  width: '1em',
});
const isDraggingStyle = css({
  display: 'none',
});

type DragDropNodeProps = NodeProps & DragDropProps;

interface ConnectedNodeProps extends DragDropNodeProps {
  connectDragSource?: DragElementWrapper<DragSourceOptions>;
  onDropResult?: (result: DropResult) => void;
  isDragging?: boolean;
}
class TreeNode extends React.Component<
  ConnectedNodeProps,
  { expanded: boolean; DropZone: ReturnType<typeof DropZoneFactory> }
> {
  root: HTMLDivElement | null = null;
  timer: number | undefined = undefined;
  constructor(props: ConnectedNodeProps) {
    super(props);
    this.state = {
      expanded: Boolean(props.expanded || props.noToggle),
      DropZone: DropZoneFactory(
        props.dropIds ? props.dropIds : props.dragId,
        props.dropDisabled,
      ),
    };
    this.toggleExpand = this.toggleExpand.bind(this);
  }
  componentDidUpdate(oldProps: ConnectedNodeProps) {
    if (
      oldProps.dropIds !== this.props.dropIds ||
      oldProps.dragId !== this.props.dragId ||
      oldProps.dropDisabled !== this.props.dropDisabled
    ) {
      this.setState(os => ({
        ...os,
        DropZone: DropZoneFactory(
          this.props.dropIds ? this.props.dropIds : this.props.dragId,
          this.props.dropDisabled,
        ),
      }));
    }
    if (oldProps.expanded !== this.props.expanded) {
      this.setState(os => ({ ...os, expanded: Boolean(this.props.expanded) }));
    }
    return true;
  }
  expandOnDrag(over: boolean) {
    if (over) {
      this.timer = window.setTimeout(
        () => this.setState(s => ({ ...s, expanded: true })),
        1000,
      );
    } else {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
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
      noToggle,
      disabled,
    } = this.props;
    const { expanded } = this.state;
    const children = this.props.children({
      nodeProps: (function () {
        let index = 0;
        return function nodeProps() {
          return { index: index++, parent: id };
        };
      })(),
    });
    const DropZone = this.state.DropZone;
    const isNode = Array.isArray(children);
    const cont = isNode && expanded && (
      <DropZone id={id} where="INSIDE" index={0}>
        {({ isOver, boundingRect }) => (
          <div className={cx({ [childrenContainer]: !noToggle })}>
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
            className={cx(
              {
                [isDraggingStyle]: isDragging ? isDragging : false,
              },
              flex,
              flexColumn,
            )}
          >
            <DropZone id={parent} index={index!} where={'AUTO'}>
              {({ isOver, boundingRect, where, separator }) => {
                this.expandOnDrag(isOver);
                return (
                  <div className={cx(flex, flexColumn)}>
                    {isOver && where === 'BEFORE' && (
                      <DropPreview boundingRect={boundingRect} />
                    )}
                    {separator(
                      <div className={cx(flex, grow, flexRow, itemCenter)}>
                        {!disabled &&
                          !noToggle &&
                          (isNode ? (
                            <div
                              className={toggleStyle}
                              onClick={this.toggleExpand}
                            >
                              <FontAwesome
                                icon={expanded ? 'caret-down' : 'caret-right'}
                              />
                            </div>
                          ) : (
                            <div className={noToggleStyle}></div>
                          ))}

                        {header}
                      </div>,
                    )}
                    {cont}
                    {isOver && where === 'AFTER' && (
                      <DropPreview boundingRect={boundingRect} />
                    )}
                  </div>
                );
              }}
            </DropZone>
          </div>,
        )
      : null;
  }
}

// TODO : QUICKLY, use hooks to avoid rerendering!!!
const DSNodeFactory = (
  accept: Parameters<typeof DragSource>[0],
  dragDisabled?: boolean,
) =>
  DragSource<NodeProps & { onDropResult: (result: DropResult) => void }>(
    accept,
    {
      canDrag() {
        return !dragDisabled;
      },
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
    function (connect, monitor) {
      return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging(),
      };
    },
  )(TreeNode);

export function Node(props: NodeProps) {
  // Ugly workaround to avoid rerendering when props changes in node
  const { dragId, dragDisabled } = props;
  const [state, setDSNode] = React.useState({
    dargNode: DSNodeFactory(dragId, dragDisabled),
  });
  React.useEffect(() => {
    setDSNode({ dargNode: DSNodeFactory(dragId, dragDisabled) });
  }, [dragId, dragDisabled]);
  const DSNode = state.dargNode;

  return (
    <DropContext.Consumer>
      {({ onDropResult }) => {
        return (
          <DSNode
            {...props}
            onDropResult={onDropResult}
            disabled={props.disabled}
          />
        );
      }}
    </DropContext.Consumer>
  );
}
