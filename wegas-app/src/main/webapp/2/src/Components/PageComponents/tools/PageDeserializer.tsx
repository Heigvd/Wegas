import * as React from 'react';
import { PageComponent, usePageComponentStore } from './componentFactory';
import {
  ComponentContainer,
  EmptyComponentContainer,
  WegasComponentProps,
  ChildrenDeserializerProps,
  ItemContainer,
  ItemContainerPropsKeys,
} from './EditableComponent';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { useStore } from '../../../data/store';
import { cloneDeep } from 'lodash-es';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';

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

function DefaultChildren(_: ChildrenDeserializerProps) {
  return null;
}


interface PageDeserializerProps {
  pageId?: string;
  path?: number[];
  uneditable?: boolean;
  context?: {
    [name: string]: unknown;
  };
  Container: ItemContainer;
  containerPropsKeys?: ItemContainerPropsKeys;
  dropzones: {
    side?: boolean;
    center?: boolean;
    empty?: boolean;
  }
}

export function PageDeserializer({
  pageId,
  path,
  uneditable,
  context,
  Container,
  containerPropsKeys,
  dropzones
}: PageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];

  const { editMode } = React.useContext(pageCTX);
  const wegasComponent = useStore(s => {
    if (!pageId) {
      return undefined;
    }

    const page = s.pages[pageId];
    if (!page) {
      return undefined;
    }

    return getComponentFromPath(page, realPath);
  }, deepDifferent);

  const { children = [], ...restProps } =
    (wegasComponent && wegasComponent.props) || {};
  const nbChildren = children.length;
  const component = usePageComponentStore(
    s => s[(wegasComponent && wegasComponent.type) || ''],
    deepDifferent,
  ) as PageComponent

  const { WegasComponent, container, componentName } = component || {};

  if (!wegasComponent) {
    return <pre>JSON error in page</pre>;
  }
  if (!component) {
    return <div>{`Unknown component : ${wegasComponent.type}`}</div>;
  }

  const Children = container ? container.ChildrenDeserializer : DefaultChildren as React.FunctionComponent<ChildrenDeserializerProps>

  return (
    <ComponentContainer
      // the key is set in order to force rerendering when page change
      //(if not, if an error occures and the page's strucutre is the same it won't render the new component)
      key={pageId}
      path={realPath}
      componentType={componentName}
      containerType={container?.type}
      context={context}
      vertical={container?.isVertical(wegasComponent.props as WegasComponentProps)}
      Container={Container}
      containerPropsKeys={containerPropsKeys}
      {...restProps}
      dropzones={{ ...component.dropzones, ...dropzones }}
    >
      <WegasComponent
        path={realPath}
        componentType={componentName}
        containerType={container?.type}
        context={context}
        Container={Container}
        containerPropsKeys={containerPropsKeys}
        {...restProps}
        dropzones={{ ...component.dropzones, ...dropzones }}
      >
        {editMode && children.length === 0 ? (
          <EmptyComponentContainer
            path={realPath}
            Container={Container}
            dropzones={{ ...component.dropzones, ...dropzones }}
          />
        ) :
          <Children {...wegasComponent?.props} nbChildren={nbChildren} path={(path ? path : [])} pageId={pageId} uneditable={uneditable} context={context} editMode={editMode} />
        }
      </WegasComponent>
    </ComponentContainer>
  );
}
