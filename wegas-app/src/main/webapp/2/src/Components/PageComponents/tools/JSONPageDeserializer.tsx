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
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { PlayerLinearLayoutChildrenProps } from '../Layouts/LinearLayout.component';

interface JSONPageDeserializerProps {
  wegasComponent?: WegasComponent;
  path?: number[];
  uneditable?: boolean;
  childrenType?: ContainerTypes;
  last?: boolean;
  linearChildrenProps?: ExtractedLayoutProps['linearChildrenProps'];
}

export function JSONPageDeserializer({
  wegasComponent,
  path,
  uneditable,
  childrenType,
  last,
  linearChildrenProps,
}: JSONPageDeserializerProps): JSX.Element {
  const realPath = path ? path : [];

  const { editMode } = React.useContext(pageCTX);

  const { children = [], ...restProps } =
    (wegasComponent && wegasComponent.props) || {};
  const nbChildren = children.length;
  const component = usePageComponentStore(
    s => s[(wegasComponent && wegasComponent.type) || ''],
    deepDifferent,
  ) as {
    WegasComponent: React.FunctionComponent<WegasComponentProps>;
    containerType: ContainerTypes;
    componentName: string;
  };

  const { WegasComponent, containerType, componentName } = component || {};
  const linearProps: PlayerLinearLayoutChildrenProps =
    containerType === 'LINEAR'
      ? { noSplitter: restProps.noSplitter, noResize: restProps.noResize }
      : {};

  if (!wegasComponent) {
    return <pre>JSON error in page</pre>;
  }
  if (!component) {
    return <div>{`Unknown component : ${wegasComponent.type}`}</div>;
  }

  return (
    <ComponentContainer
      // the key is set in order to force rerendering when page change
      //(if not, if an error occures and the page's strucutre is the same it won't render the new component)
      key={JSON.stringify({ ...restProps, realPath })}
      path={realPath}
      last={last}
      componentType={componentName}
      containerType={containerType}
      childrenType={childrenType}
      linearChildrenProps={linearChildrenProps}
      {...restProps}
    >
      <WegasComponent
        path={realPath}
        last={last}
        componentType={componentName}
        containerType={containerType}
        childrenType={childrenType}
        {...restProps}
      >
        {editMode && children.length === 0 ? (
          <EmptyComponentContainer
            childrenType={containerType}
            path={realPath}
          />
        ) : (
          children.map((c, i) => (
            <JSONPageDeserializer
              key={JSON.stringify([...(path ? path : []), i])}
              wegasComponent={c}
              path={[...(path ? path : []), i]}
              uneditable={uneditable}
              childrenType={containerType}
              linearChildrenProps={linearProps}
              last={i === nbChildren - 1}
            />
          ))
        )}
      </WegasComponent>
    </ComponentContainer>
  );
}
