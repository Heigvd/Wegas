import { css } from 'emotion';
import produce from 'immer';
import { Connection, Defaults, jsPlumb, jsPlumbInstance } from 'jsplumb';
import * as React from 'react';
import { IconButton } from '../../Components/Button/IconButton';
import { VariableDescriptor } from '../../data/selectors';
import { StoreConsumer, StoreDispatch } from '../../data/store';
import { entityIs } from '../../data/entities';
import { Actions } from '../../data';
import { Toolbar } from '../../Components/Toolbar';
import { FontAwesome } from './Views/FontAwesome';

const editorStyle = css({
  position: 'relative',
  '& .jtk-connector': {
    zIndex: 1,
    '&.jtk-hover': {
      zIndex: 9,
    },
  },
  '& .jtk-endpoint': {
    color: 'transparent',
    zIndex: 2,
    ':hover': {
      color: 'tomato',
    },
  },
  '& .jtk-overlay': {
    zIndex: 3,
    padding: 5,
    border: '1px solid',
    backgroundColor: 'white',
    '&.jtk-hover': {
      zIndex: 10,
    },
    ':empty': {
      padding: 0,
      border: 0,
    },
  },
});
const JS_PLUMB_OPTIONS: Defaults = {
  Anchor: ['Continuous', { faces: ['top', 'left', 'bottom'] }],
  //                    Anchor: ["Perimeter", {shape: "Rectangle", anchorCount: 120}],
  ConnectionsDetachable: true,
  ReattachConnections: false,
  Endpoint: [
    'Dot',
    {
      radius: 7,
    },
  ],
  // @ts-ignore
  EndpointStyle: { fill: 'currentColor' },
  Connector: ['Flowchart'],
  ConnectionOverlays: [
    [
      'Arrow',
      {
        location: 1,
        width: 10,
        length: 10,
        foldback: 1,
      },
    ],
  ],
  PaintStyle: {
    strokeWidth: 4,
    stroke: 'darkgray',
    outlineStroke: 'white',
    outlineWidth: 2,
  },
  HoverPaintStyle: {
    stroke: '#03283A',
  },
};

interface StateMachineEditorProps {
  stateMachine: IFSMDescriptor;
  dispatch: StoreDispatch;
}
class StateMachineEditor extends React.Component<
  StateMachineEditorProps,
  {
    plumb?: jsPlumbInstance;
    stateMachine: IFSMDescriptor;
    oldProps: StateMachineEditorProps;
  }
> {
  static getDerivedStateFromProps(
    nextProps: StateMachineEditorProps,
    { oldProps }: { oldProps: StateMachineEditorProps },
  ) {
    if (oldProps === nextProps) {
      return null;
    }
    return { oldProps: nextProps, stateMachine: nextProps.stateMachine };
  }
  constructor(props: StateMachineEditorProps) {
    super(props);
    this.state = { oldProps: props, stateMachine: props.stateMachine };
  }
  container: Element | null = null;
  update(stateMachine: IFSMDescriptor) {
    this.setState({ stateMachine });
  }
  removeTransition = ({
    from,
    transitonIndex,
  }: {
    from: string;
    transitonIndex: number;
  }) => {
    this.setState(
      produce<{ stateMachine: IFSMDescriptor; oldProps: any }>(state => {
        const { states } = state.stateMachine!;
        states[from].transitions.splice(transitonIndex, 1);
      }),
    );
  };
  createTransition = ({ from, to }: { from: number; to: number }) => {
    this.setState(
      produce<{ stateMachine: IFSMDescriptor; oldProps: any }>(state => {
        const { states } = state.stateMachine;
        states[from].transitions.push({
          '@class': 'Transition',
          nextStateId: to,
          triggerCondition: null,
          preStateImpact: null,
          version: 0,
        });
      }),
    );
  };
  moveTransition = (
    info: {
      originalSourceId: string;
      originalTargetId: string;
      newSourceId: string;
      newTargetId: string;
    },
    transition: IFSMDescriptor.Transition,
  ) => {
    this.setState(
      produce<{ stateMachine: IFSMDescriptor }>(state => {
        const { states } = state.stateMachine;
        if (info.originalSourceId === info.newSourceId) {
          const tr = states[info.originalSourceId].transitions.find(
            t => t.id === transition.id,
          );
          if (tr != null) {
            tr.nextStateId = Number(info.newTargetId);
          }
        } else {
          states[info.originalSourceId].transitions = states[
            info.originalSourceId
          ].transitions.filter(t => t.id !== transition.id);
          states[info.newSourceId].transitions.push({
            ...transition,
            stateId: undefined, // remove ref.
          });
        }
      }),
    );
  };
  deleteState = (id: string) => {
    this.setState(
      produce<{ stateMachine: IFSMDescriptor; oldProps: any }>(state => {
        const { states } = state.stateMachine!;
        delete states[id];
        // delete transitions pointing to deleted state
        for (const s in states) {
          states[s].transitions = states[s].transitions.filter(
            t => String(t.nextStateId) !== id,
          );
        }
      }),
    );
  };
  moveState = (id: string, pos: [number, number]) => {
    this.setState(
      produce<{ stateMachine: IFSMDescriptor }>(state => {
        state.stateMachine.states[id].editorPosition.x = pos[0];
        state.stateMachine.states[id].editorPosition.y = pos[1];
      }),
    );
  };
  createState = (state: IFSMDescriptor.State, transitionSource?: number) => {
    this.setState(
      produce<{ stateMachine: IFSMDescriptor; oldProps: any }>(store => {
        const nextId =
          Object.keys(store.stateMachine.states).reduce(
            (p, c) => Math.max(Number(c), p),
            0,
          ) + 1;
        store.stateMachine.states[nextId] = state;
        if (transitionSource != undefined) {
          store.stateMachine.states[transitionSource].transitions.push({
            '@class': 'Transition',
            nextStateId: nextId,
            triggerCondition: null,
            preStateImpact: null,
            version: 0,
          });
        }
        return;
      }),
    );
  };
  editState = (id: string) => {
    this.props.dispatch(
      Actions.EditorActions.editVariable(
        this.props.stateMachine,
        ['states', id],
        undefined,
        {
          delete:
            Number(id) !==
            this.props.stateMachine.defaultInstance.currentStateId
              ? (_entity, path) => {
                  this.deleteState(path![1]);
                }
              : undefined,
        },
      ),
    );
  };
  editTransition = (path: [string, number]) => {
    this.props.dispatch(
      Actions.EditorActions.editVariable(
        this.props.stateMachine,
        ['states', path[0], 'transitions', String(path[1])],
        undefined,
        {
          delete: (_entity, path) => {
            if (path != null) {
              this.removeTransition({
                from: path[0],
                transitonIndex: Number(path[1]),
              });
            }
          },
        },
      ),
    );
  };
  componentDidMount() {
    const plumb = jsPlumb.getInstance({
      ...JS_PLUMB_OPTIONS,
      Container: this.container,
    });
    this.setState({
      plumb,
    });
    plumb.bind('connection', (info, ev) => {
      if (ev !== undefined) {
        // let the data create it!
        plumb.deleteConnection(info.connection);
        this.createTransition({
          from: Number(info.sourceId),
          to: Number(info.targetId),
        });
      }
    });
    plumb.bind('connectionDetached', (info, ev) => {
      if (ev !== undefined) {
        const trIndex = (info.connection as any).getParameter(
          'transitionIndex',
        );
        // let jsPlumb remove transition the update data
        requestAnimationFrame(() =>
          this.removeTransition({
            from: info.sourceId,
            transitonIndex: trIndex,
          }),
        );
      }
    });
    plumb.bind('connectionMoved', (info, ev) => {
      if (ev !== undefined) {
        const transition: IFSMDescriptor.Transition = (info.connection as any).getParameter(
          'transition',
        );
        this.moveTransition(info, transition);
      }
    });
    plumb.bind('connectionAborted', async connection => {
      const left = (connection.target as HTMLElement).style.left;
      const top = (connection.target as HTMLElement).style.top;
      const src = connection.sourceId;
      this.createState(
        {
          '@class': 'State',
          editorPosition: {
            '@class': 'Coordinate',
            x: parseInt(left || '0', 10),
            y: parseInt(top || '0', 10),
          },
          version: 0,
          transitions: [],
        },
        Number(src),
      );
    });
  }
  componentWillUnmount() {
    if (this.state.plumb != null) {
      this.state.plumb.unbind();
    }
  }
  componentDidUpdate(
    _prevProps: StateMachineEditorProps,
    { stateMachine: oldStateMachine }: { stateMachine: IFSMDescriptor },
  ) {
    requestAnimationFrame(() => {
      if (this.state.plumb != null) {
        this.state.plumb.setSuspendDrawing(false, true);
      }
    });
    const { stateMachine } = this.state;
    if (
      oldStateMachine !== stateMachine &&
      this.props.stateMachine !== stateMachine
    ) {
      this.props.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(stateMachine),
      );
    }
  }
  render() {
    const { plumb, stateMachine } = this.state;
    if (stateMachine == null) {
      return null;
    }
    if (plumb != null) {
      plumb.setSuspendDrawing(true);
    }
    return (
      <div
        ref={n => {
          this.container = n;
        }}
        className={editorStyle}
      >
        {plumb != null &&
          Object.keys(stateMachine.states).map(k => {
            return (
              <State
                editState={this.editState}
                state={stateMachine.states[k]}
                id={k}
                initialState={
                  stateMachine.defaultInstance.currentStateId === Number(k)
                }
                key={k}
                plumb={plumb}
                deleteState={this.deleteState}
                moveState={this.moveState}
                editTransition={this.editTransition}
              />
            );
          })}
      </div>
    );
  }
}
export default function ConnectedStateMachineEditor() {
  return (
    <StoreConsumer<IVariableDescriptor | undefined>
      selector={s =>
        s.global.stateMachineEditor
          ? VariableDescriptor.select(s.global.stateMachineEditor.id)
          : undefined
      }
    >
      {({ state, dispatch }) => {
        if (entityIs<IFSMDescriptor>(state, 'FSMDescriptor')) {
          return (
            <StateMachineEditor stateMachine={state} dispatch={dispatch} />
          );
        }
        return null;
      }}
    </StoreConsumer>
  );
}

const stateStyle = css({
  width: '10em',
  height: '5em',
  border: '1px solid',
  zIndex: 2,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
});
const sourceStyle = css({
  display: 'inline-block',
  cursor: 'move',
  alignSelf: 'center',
  '& svg': {
    pointerEvents: 'none',
  },
});
class State extends React.Component<{
  state: IFSMDescriptor.State;
  id: string;
  initialState: boolean;
  plumb: jsPlumbInstance;
  editState: (id: string) => void;
  deleteState: (id: string) => void;
  moveState: (id: string, pos: [number, number]) => void;

  editTransition: (
    path: [string, number],
    transition: IFSMDescriptor.Transition,
  ) => void;
}> {
  container: Element | null = null;
  componentDidMount() {
    const { plumb } = this.props;
    plumb.draggable(this.container!, {
      stop: params => {
        this.props.moveState(this.props.id, params.pos);
      },
    });
    plumb.makeSource(this.container!, { filter: `.${sourceStyle}` });
    plumb.makeTarget(this.container!, {});
  }
  componentWillUnmount() {
    if (this.container != null) {
      const { plumb } = this.props;
      plumb.unmakeSource(this.container);
      plumb.unmakeTarget(this.container);
      plumb.removeAllEndpoints(this.container);
      /*
      @HACK Alter internal managedElements, make jsplumb forget about this node.
      Allows to reuse a node with same id.
      */
      //@ts-ignore
      delete plumb.getManagedElements()[this.props.id];
    }
  }
  onClick = () => this.props.editState(this.props.id);
  render() {
    const { state, initialState } = this.props;
    return (
      <div
        className={stateStyle}
        id={this.props.id}
        ref={n => {
          this.container = n;
        }}
        style={{
          position: 'absolute',
          left: state.editorPosition.x,
          top: state.editorPosition.y,
        }}
      >
        <Toolbar vertical>
          <Toolbar.Content>{state.label}</Toolbar.Content>
          <Toolbar.Header>
            <IconButton icon="edit" onClick={this.onClick} />
            <div className={sourceStyle}>
              <FontAwesome icon="project-diagram" />
            </div>
            {!initialState && (
              <IconButton
                icon="trash"
                onClick={() => this.props.deleteState(this.props.id)}
              />
            )}
          </Toolbar.Header>
        </Toolbar>
        {state.transitions.map((t, i) => (
          <Transition
            key={`${this.props.id}-${t.nextStateId}-${t.id}`}
            plumb={this.props.plumb}
            transition={t}
            position={i}
            parent={this.props.id}
            editTransition={this.props.editTransition}
          />
        ))}
      </div>
    );
  }
}

class Transition extends React.Component<{
  transition: IFSMDescriptor.Transition;
  plumb: jsPlumbInstance;
  parent: string;
  position: number;
  editTransition: (
    path: [string, number],
    transition: IFSMDescriptor.Transition,
  ) => void;
}> {
  connection: Connection | null = null;
  componentDidMount() {
    const src = this.props.parent;
    const tgt = String(this.props.transition.nextStateId);
    this.connection = this.props.plumb.connect({
      source: src,
      target: tgt,
      ...(src === tgt ? ({ connector: ['StateMachine'] } as any) : undefined),
    });
    (this.connection as any).bind('click', (connection: any) => {
      this.props.editTransition(
        [this.props.parent, this.props.position],
        connection.getParameter('transition'),
      );
    });
    this.updateData();
  }
  componentDidUpdate() {
    this.updateData();
  }
  updateData = () => {
    const { triggerCondition } = this.props.transition;
    const label = triggerCondition ? triggerCondition.content : '';
    try {
      this.connection!.setParameter('transition', this.props.transition);
      this.connection!.setParameter('transitionIndex', this.props.position);
      this.connection!.setLabel(label);
    } catch {}
  };
  componentWillUnmount() {
    if (this.connection != null) {
      try {
        this.props.plumb.deleteConnection(this.connection);
      } catch {
        // Mostly because jsplumb already deleted it.
      }
    }
  }
  render() {
    return null;
  }
}
