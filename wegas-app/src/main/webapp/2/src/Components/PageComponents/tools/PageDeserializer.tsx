import * as React from 'react';
import { usePageComponentStore } from './componentFactory';
import {
  ContainerTypes,
  ComponentContainer,
  EmptyComponentContainer,
  WegasComponentProps,
  ExtractedLayoutProps,
} from './EditableComponent';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { useStore } from '../../../data/store';
import { cloneDeep } from 'lodash-es';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { PlayerLinearLayoutChildrenProps } from '../Layouts/LinearLayout.component';

function getComponentFromPath(page: WegasComponent, path: number[]) {
  const newPath = [...path];
  let component: WegasComponent = cloneDeep(page);
  while (newPath.length > 0) {
    const index = newPath.shift();
    if (
      index == null ||
      component == null ||
      component.props == null ||
      component.props.children == null
    ) {
      return undefined;
    } else {
      component = component.props.children[index];
    }
  }
  return component;
}

interface PageDeserializerProps {
  pageId?: string;
  path?: number[];
  uneditable?: boolean;
  childrenType?: ContainerTypes;
  last?: boolean;
  linearChildrenProps?: ExtractedLayoutProps['linearChildrenProps'];
}

export function PageDeserializer({
  pageId,
}: // path,
// uneditable,
// childrenType,
// last,
// linearChildrenProps,
PageDeserializerProps): JSX.Element {
  return <ComponentContainer pageId={pageId} />;
  // const realPath = path ? path : [];

  // const { editMode } = React.useContext(pageCTX);
  // const wegasComponent = useStore(s => {
  //   if (!pageId) {
  //     return undefined;
  //   }

  //   const page = s.pages[pageId];
  //   if (!page) {
  //     return undefined;
  //   }

  //   return getComponentFromPath(page, realPath);
  // }, deepDifferent);

  // const { children = [], ...restProps } =
  //   (wegasComponent && wegasComponent.props) || {};
  // const nbChildren = children.length;
  // const component = usePageComponentStore(
  //   s => s[(wegasComponent && wegasComponent.type) || ''],
  //   deepDifferent,
  // ) as {
  //   WegasComponent: React.FunctionComponent<WegasComponentProps>;
  //   containerType: ContainerTypes;
  //   componentName: string;
  // };

  // const { WegasComponent, containerType, componentName } = component || {};
  // const linearProps: PlayerLinearLayoutChildrenProps =
  //   containerType === 'LINEAR'
  //     ? { noSplitter: restProps.noSplitter, noResize: restProps.noResize }
  //     : {};

  // const oldRef = React.useRef({
  //   containerType,
  //   pageId,
  //   uneditable,
  //   path,
  // });

  // const childrenPack = React.useMemo(() => {
  //   oldRef.current = { containerType, pageId, uneditable, path };
  //   const newChildren = [];
  //   for (let i = 0; i < nbChildren; ++i) {
  //     newChildren.push(
  //       <PageDeserializer
  //         key={JSON.stringify([...(path ? path : []), i])}
  //         pageId={pageId}
  //         path={[...(path ? path : []), i]}
  //         uneditable={uneditable}
  //         childrenType={containerType}
  //         linearChildrenProps={linearProps}
  //         last={i === nbChildren - 1}
  //       />,
  //     );
  //   }
  //   return newChildren;
  // }, [nbChildren, containerType, pageId, uneditable, path, linearProps]);

  // if (!wegasComponent) {
  //   return <pre>JSON error in page</pre>;
  // }
  // if (!component) {
  //   return <div>{`Unknown component : ${wegasComponent.type}`}</div>;
  // }

  // return (
  //   <ComponentContainer
  //     // the key is set in order to force rerendering when page change
  //     //(if not, if an error occures and the page's strucutre is the same it won't render the new component)
  //     key={pageId}
  //     path={realPath}
  //     last={last}
  //     componentType={componentName}
  //     containerType={containerType}
  //     childrenType={childrenType}
  //     linearChildrenProps={linearChildrenProps}
  //     {...restProps}
  //   >
  //     <WegasComponent
  //       path={realPath}
  //       last={last}
  //       componentType={componentName}
  //       containerType={containerType}
  //       childrenType={childrenType}
  //       {...restProps}
  //     >
  //       {editMode && children.length === 0 ? (
  //         <EmptyComponentContainer
  //           childrenType={containerType}
  //           path={realPath}
  //         />
  //       ) : (
  //         childrenPack
  //       )}
  //     </WegasComponent>
  //   </ComponentContainer>
  // );
}
