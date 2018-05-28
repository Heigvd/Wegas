import { css } from 'emotion';
import produce from 'immer';
import { Connection, Defaults, jsPlumb, jsPlumbInstance } from 'jsplumb';
import * as React from 'react';
import { connect } from 'react-redux';
import { IconButton } from '../../Components/Button/IconButton';
import { State as DataStore } from '../../data/Reducer/reducers';
import { VariableDescriptor } from '../../data/selectors';

const endpointStyle = css({
  color: 'transparent',
  ':hover': {
    color: 'tomato',
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
      cssClass: endpointStyle,
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
    strokeWidth: 3,

    // outlineColor: 'white',
    stroke: 'darkgray',
    // outlineWidth: 4,
  },
  HoverPaintStyle: {
    stroke: '#03283A',
  },
};

interface StateMachineEditorProps {
  stateMachine: IFSMDescriptor;
}
class StateMachineEditor extends React.Component<
  StateMachineEditorProps,
  {
    plumb?: jsPlumbInstance;
    stateMachine?: IFSMDescriptor;
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
    transiton,
  }: {
    from: string;
    transiton: IFSMDescriptor.Transition;
  }) => {
    this.setState(
      produce<{ stateMachine: IFSMDescriptor; oldProps: any }>(state => {
        const { states } = state.stateMachine!;
        states[from].transitions = states[from].transitions.filter(
          t => t.id !== transiton.id,
        );
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
  createState = (state: IFSMDescriptor.State): Promise<number> => {
    return new Promise(resolve =>
      this.setState(
        produce<{ stateMachine: IFSMDescriptor; oldProps: any }>(store => {
          const nextId =
            Object.keys(store.stateMachine.states).reduce(
              (p, c) => Math.max(Number(c), p),
              0,
            ) + 1;
          store.stateMachine.states[nextId] = state;
          resolve(nextId);
          return;
        }),
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
        this.removeTransition({
          from: info.sourceId,
          transiton: (info.connection as any).getParameter('transition'),
        });
      }
    });
    plumb.bind('connectionMoved', (info, ev) => {
      if (ev !== undefined) {
        this.removeTransition({
          from: info.originalSourceId,
          transiton: (info.connection as any).getParameter('transition'),
        });
      }
    });
    plumb.bind('connectionAborted', async connection => {
      const left = (connection.target as HTMLElement).style.left;
      const top = (connection.target as HTMLElement).style.top;
      const src = connection.sourceId;
      const newStateId = await this.createState({
        '@class': 'State',
        editorPosition: {
          '@class': 'Coordinate',
          x: parseInt(left || '0', 10),
          y: parseInt(top || '0', 0),
        },
        version: 0,
        transitions: [],
      });
      this.createTransition({ from: Number(src), to: newStateId });
    });
  }
  componentWillUnmount() {
    if (this.state.plumb != null) {
      this.state.plumb.unbind();
    }
  }
  componentDidUpdate() {
    requestAnimationFrame(() => {
      if (this.state.plumb != null) {
        this.state.plumb.setSuspendDrawing(false, true);
      }
    });
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
        style={{ position: 'relative' }}
      >
        {plumb != null &&
          Object.keys(stateMachine.states).map(k => {
            return (
              <State
                state={stateMachine.states[k]}
                id={k}
                initialState={
                  stateMachine.defaultInstance.currentStateId === Number(k)
                }
                key={k}
                plumb={plumb}
                deleteState={this.deleteState}
              />
            );
          })}
      </div>
    );
  }
}

export default connect((state: DataStore) => {
  return {
    stateMachine: state.global.stateMachineEditor
      ? VariableDescriptor.select(state.global.stateMachineEditor.id)
      : undefined,
  };
})(StateMachineEditor);

const stateStyle = css({
  width: '10em',
  height: '5em',
  border: '1px solid',
});
const sourceStyle = css({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: 'hotpink',
});
class State extends React.Component<{
  state: IFSMDescriptor.State;
  id: string;
  initialState: boolean;
  plumb: jsPlumbInstance;
  deleteState: (id: string) => void;
}> {
  container: Element | null = null;
  componentDidMount() {
    const { plumb } = this.props;
    (window as any).p = plumb;
    plumb.draggable(this.container!);
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
        <div style={{ position: 'relative' }}>
          {state.label}
          {state.transitions.map(t => (
            <Transition
              key={`${this.props.id}-${t.nextStateId}-${t.id}`}
              plumb={this.props.plumb}
              transition={t}
              parent={this.props.id}
            />
          ))}
          {!initialState && (
            <IconButton
              icon="trash"
              onClick={() => this.props.deleteState(this.props.id)}
            />
          )}
          <div className={String(sourceStyle)} />
        </div>
      </div>
    );
  }
}

class Transition extends React.Component<{
  transition: IFSMDescriptor.Transition;
  plumb: jsPlumbInstance;
  parent: string;
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
    this.connection.setParameter('transition', this.props.transition);
  }
  componentWillUnmount() {
    if (this.connection != null) {
      // this.props.plumb.deleteConnection(this.connection);
    }
  }
  render() {
    return null;
  }
}
