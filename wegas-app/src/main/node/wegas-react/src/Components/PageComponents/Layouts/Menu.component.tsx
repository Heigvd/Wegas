import * as React from 'react';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import {
  defaultFlexLayoutOptionsKeys,
  flexlayoutChoices,
} from '../../Layouts/FlexList';
import {
  Menu,
  MenuChildren,
  MenuItemProps,
  menuItemSchema,
  MenuProps,
  menuSchema,
} from '../../Layouts/Menu';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  ComponentDropZone,
  WegasComponentProps,
} from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';

interface PlayerMenuProps extends MenuProps, WegasComponentProps {
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
}

function PlayerMenu(props: PlayerMenuProps) {
  return <>{props.children}</>;
}

function isVertical(props: PlayerMenuProps) {
  return props.vertical;
}

function EmmptyComponentContainer({ path }: { path: number[] }) {
  const { onDrop } = React.useContext(pageCTX);
  return (
    <div>
      <ComponentDropZone
        onDrop={dndComponent => {
          onDrop(dndComponent, path);
        }}
        show={true}
        noFocus={true}
        dropPosition="INTO"
      />
      {'The layout is empty, drop components in to fill it!'}
    </div>
  );
}

function ChildrenDeserializer({
  vertical,
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  editMode,
  containerPropsKeys,
  inheritedOptionsState,
}: ChildrenDeserializerProps<MenuProps>) {
  const items = wegasChildren?.reduce<MenuChildren>((o, child, i) => {
    const menuChildProps = child.props as MenuItemProps;
    return {
      ...o,
      [menuChildProps.componentId]: {
        label: menuChildProps.componentLabel,
        content: (
          <PageDeserializer
            key={JSON.stringify([...path, i])}
            pageId={pageId}
            path={[...path, i]}
            uneditable={uneditable}
            context={context}
            containerPropsKeys={containerPropsKeys}
            dropzones={{ center: true }}
            inheritedOptionsState={inheritedOptionsState}
          />
        ),
      },
    };
  }, {});

  if (editMode && (!wegasChildren || wegasChildren.length === 0)) {
    return <EmmptyComponentContainer path={path} />;
  } else {
    return <Menu vertical={vertical} items={items || {}} />;
  }
}

registerComponent(
  pageComponentFactory({
    component: PlayerMenu,
    componentType: 'Layout',
    container: {
      isVertical,
      ChildrenDeserializer: ChildrenDeserializer,
      childrenAdditionalShema: menuItemSchema,
      childrenLayoutOptionSchema: flexlayoutChoices,
      childrenLayoutKeys: defaultFlexLayoutOptionsKeys,
    },
    dropzones: {},
    name: 'Menu',
    icon: 'bars',
    illustration: 'menu',
    schema: { ...menuSchema, ...classStyleIdShema },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
