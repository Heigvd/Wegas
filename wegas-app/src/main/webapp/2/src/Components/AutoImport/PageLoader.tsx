import * as React from 'react';
import { StoreConsumer } from '../../data/store';
import { deserialize } from '../AutoImport';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';
import { themeVar } from '../Theme';
import { Actions } from '../../data';
import { TextLoader } from '../Loader';

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
// const maskRoot = css({
//   position: 'relative',
//   display: 'inline-block',
//   boxShadow: '0 0 1px 1px ',
// });
// const mask = css({
//   position: 'absolute',
//   display: 'inline-block',
//   zIndex: 1,
//   top: 0,
//   left: 0,
//   width: '100%',
//   height: '100%',
//   cursor: 'pointer',
// });
// function editable<T>(Comp: React.ComponentType<T>, name?: string) {
//   type EditProps = {
//     __path: string[];
//   } & T;
//   class EditableComponent extends React.Component<EditProps> {
//     static displayName = name || Comp.displayName;
//     componentDidCatch(e: any) {
//       console.warn(e);
//     }
//     render() {
//       const cleanedProps = Object.assign({}, this.props, {
//         __path: undefined,
//       });
//       return (
//         <StoreConsumer selector={(s: State) => s.global.pageEdit}>
//           {({ state, dispatch }) => {
//             if (state) {
//               return (
//                 <div
//                   className={maskRoot}
//                   onClick={event => {
//                     event.stopPropagation();
//                     dispatch(
//                       Actions.EditorActions.editComponent(
//                         '1',
//                         this.props.__path,
//                       ),
//                     );
//                   }}
//                 >
//                   <div className={mask} />
//                   <Comp {...cleanedProps} />
//                 </div>
//               );
//             }
//             return <Comp {...cleanedProps} />;
//           }}
//         </StoreConsumer>
//       );
//     }
//   }
//   return EditableComponent;
// }

interface PageLoaderProps {
  page?: Page;
  id?: string;
}
const PageLoaderTracker = new Set<PageLoader>();
function countLoaded(id?: string) {
  let count = 0;
  PageLoaderTracker.forEach(pl => {
    if (pl.props.id === id) {
      count += 1;
    }
  });
  return count;
}

const Suspend = React.lazy(() => new Promise(() => {}));

class PageLoader extends React.Component<PageLoaderProps, { load: boolean }> {
  constructor(props: PageLoaderProps) {
    super(props);
    this.state = {
      load: true,
    };
    PageLoaderTracker.add(this);
  }
  componentDidCatch(e: any) {
    console.warn(e);
  }
  componentWillUnmount() {
    PageLoaderTracker.delete(this);
  }
  componentDidMount() {
    if (countLoaded(this.props.id) > 1 && this.state.load) {
      this.setState({
        load: false,
      });
    }
  }
  componentDidUpdate() {
    if (countLoaded(this.props.id) > 1 && this.state.load) {
      this.setState({
        load: false,
      });
    }
  }
  render() {
    if (this.props.page == null) {
      return <Suspend />;
    }
    if (!this.state.load) {
      return (
        <span>
          <FontAwesome
            style={{ color: themeVar.warningColor }}
            icon="exclamation-triangle"
          />
          Page {this.props.id} loaded more than once
        </span>
      );
    }
    const tree = deserialize(this.props.page);
    return tree;
  }
}

export default function ConnectedPageLoader({ id }: { id?: string }) {
  return (
    <StoreConsumer<{ page: Readonly<Page> | undefined; id?: string }>
      selector={s => ({ page: id !== undefined ? s.pages[id] : undefined, id })}
    >
      {({ state, dispatch }) => {
        if (state.page == null && state.id != null) {
          dispatch(Actions.PageActions.get(id));
        }
        return (
          <React.Suspense fallback={<TextLoader text="Building World!" />}>
            <PageLoader id={id} page={state.page} />
          </React.Suspense>
        );
      }}
    </StoreConsumer>
  );
}
