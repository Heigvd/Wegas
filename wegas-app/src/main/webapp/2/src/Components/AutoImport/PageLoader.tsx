import * as React from 'react';
import { StoreConsumer } from '../../data/store';
import { importComponent } from '..';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';
import { themeVar } from '../Theme';

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

function deserialize(
  json: WegasComponent,
  key?: string | number,
  path: string[] = [],
): JSX.Element {
  const { children = [], ...restProps } = json.props || {};
  // Should await all children as well.
  const type = importComponent(json.type);
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
class PageLoader extends React.Component<PageLoaderProps> {
  constructor(props: PageLoaderProps) {
    super(props);
    PageLoaderTracker.add(this);
  }
  componentDidCatch(e: any) {
    console.warn(e);
  }
  componentWillUnmount() {
    PageLoaderTracker.delete(this);
  }
  render() {
    if (this.props.page == null) {
      return <span>Loading...</span>;
    }
    if (countLoaded(this.props.id) > 1) {
      return (
        <span>
          <FontAwesome
            style={{ color: themeVar.warningColor }}
            icon="exclamation-triangle"
          />Page {this.props.id} loaded more than once
        </span>
      );
    }
    const tree = deserialize(this.props.page);
    return <div>{tree}</div>;
  }
}
export default function ConnectedPageLoader({ id }: { id?: string }) {
  return (
    <StoreConsumer<Readonly<Page> | undefined>
      selector={s => (id ? s.pages[id] : undefined)}
    >
      {({ state }) => {
        return <PageLoader id={id} page={state} />;
      }}
    </StoreConsumer>
  );
}
