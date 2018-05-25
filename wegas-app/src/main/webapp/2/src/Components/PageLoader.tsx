import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../data/Reducer/reducers';
import { css } from 'glamor';
import { Actions } from '../data/index';

/**
 * Test Widget to be removed
 * @param props
 */
function Print(props: any) {
  return (
    <span>
      <span>Print:</span> {props.message}
      <span>{props.children}</span>
    </span>
  );
}

const AVAILABLE: { [key: string]: React.ComponentType } = {
  Print: editable(Print, 'Print'),
};
// function inferComponenent(type: string | React.ComponentType) {
//     if (typeof type == 'string') {
//         return type;
//     }
//     return type.displayName || type.name || 'span';
// }
// function serialize(tree: React.ReactElement<any>) {
//     const { children } = tree.props;
//     let c;

//     if (Array.isArray(children)) {
//         c = children;
//     } else if (children) {
//         c = [children];
//     } else {
//         c = [];
//     }
//     let acc: WegasComponent = {
//         type: inferComponenent(tree.type),
//         props: {
//             ...tree.props,
//             children: c.map(c => serialize(c)),
//         },
//     };

//     return acc;
// }
const maskRoot = css({
  position: 'relative',
});
const mask = css({
  position: 'absolute',
  zIndex: 1,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  cursor: 'pointer',
  boxShadow: '0 0 1px 1px ',
});
function editable<T>(Comp: React.ComponentType<T>, name?: string) {
  type EditProps = {
    __editMode: boolean;
    __path: string[];
    dispatch: (a: any) => void;
  } & T;
  class EditableComponent extends React.Component<EditProps> {
    static displayName = name || Comp.displayName;
    constructor(props: EditProps) {
      super(props);
      this.edit = this.edit.bind(this);
    }
    private edit(e: React.MouseEvent<HTMLDivElement>) {
      e.stopPropagation();
      this.props.dispatch(
        Actions.EditorActions.editComponent('1', this.props.__path),
      );
    }
    componentDidCatch(e: any) {
      console.warn(e);
    }
    render() {
      const cleanedProps = Object.assign({}, this.props, {
        __editMode: undefined,
        __path: undefined,
        dispatch: undefined,
      });
      if (this.props.__editMode) {
        return (
          <span {...maskRoot} onClick={this.edit}>
            <span {...mask} />
            <Comp {...cleanedProps} />
          </span>
        );
      }
      return <Comp {...cleanedProps} />;
    }
  }
  return connect((state: State) => {
    return { __editMode: state.global.pageEdit };
  })(EditableComponent);
}

function deserialize(
  json: WegasComponent,
  key?: string | number,
  path: string[] = [],
): JSX.Element {
  const { children = [], ...restProps } = json.props || {};
  const type = AVAILABLE[json.type];
  if (type == null) {
    return <span>Unkown "{json.type}"</span>;
  }
  return React.createElement(
    type,
    { key, __path: path, ...restProps } as any,
    children.map((c, i) => deserialize(c, i, path.concat([String(i)]))),
  );
}
interface PageLoaderProps {
  page?: Page;
  id?: string;
}

class PageLoader extends React.Component<
  PageLoaderProps,
  { json?: Page; oldProps: PageLoaderProps }
> {
  static getDerivedStateFromProps(
    nextProps: PageLoaderProps,
    state: { json?: Page; oldProps: PageLoaderProps },
  ) {
    const json = state.oldProps !== nextProps ? nextProps.page : state.json;
    return {
      oldProps: nextProps,
      json,
    };
  }
  constructor(props: PageLoaderProps) {
    super(props);
    this.state = {
      json: props.page,
      oldProps: props,
    };
    this.update = this.update.bind(this);
  }
  update(json: Page) {
    this.setState({ json });
  }
  componentDidCatch(e: any) {
    console.warn(e);
  }
  render() {
    if (this.state.json == null) {
      return <span>Loading...</span>;
    }
    const tree = deserialize(this.state.json);
    return <div>{tree}</div>;
  }
}
export default connect((state: State, props: { id?: string }) => {
  return {
    page: props.id ? state.pages[props.id] : undefined,
  } as {
    page?: Page;
  };
})(PageLoader);
