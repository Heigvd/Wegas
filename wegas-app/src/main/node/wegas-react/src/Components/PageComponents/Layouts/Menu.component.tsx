import * as React from 'react';
import { FlexItem } from '../../Layouts/FlexList';
import {
  LabelFNArgs,
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
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { EmptyComponentContainer } from './FlexList.component';

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

function PlayerMenuLabel({ children }: WegasComponentProps) {
  return <>{children}</>;
}
const PlayerMenuLabelName = 'MenuLabel';

function PlayerMenuItems({ children }: WegasComponentProps) {
  return <>{children}</>;
}
const PlayerMenuItemsName = 'MenuItems';

registerComponent(
  pageComponentFactory({
    component: PlayerMenuLabel,
    componentType: 'Utility',
    container: {},
    name: PlayerMenuLabelName,
    icon: 'bars',
    illustration: 'menu',
    schema: {},
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      allowDelete: () => false,
      allowMove: () => false,
      allowChildren: wegasComponent =>
        wegasComponent.props.children == null ||
        wegasComponent.props.children.length === 0,
      allowEdit: () => false,
    },
  }),
);

registerComponent(
  pageComponentFactory({
    component: PlayerMenuItems,
    componentType: 'Utility',
    name: PlayerMenuItemsName,
    container: {
      childrenAdditionalShema: menuItemSchema,
    },
    icon: 'bars',
    illustration: 'menu',
    schema: {},
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      allowDelete: () => false,
      allowMove: () => false,
      allowEdit: () => false,
    },
  }),
);

function MenuLabel({
  path,
  pageId,
  uneditable,
  context,
  containerPropsKeys,
  inheritedOptionsState,
  item,
}: ChildrenDeserializerProps<{ item: LabelFNArgs }>) {
  const newContext = { ...context, menuItem: item };
  return (
    <PageDeserializer
      key={JSON.stringify(path)}
      pageId={pageId}
      path={path}
      uneditable={uneditable}
      context={newContext}
      containerPropsKeys={containerPropsKeys}
      dropzones={{ center: true }}
      inheritedOptionsState={inheritedOptionsState}
    />
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
  const menuLabel = wegasChildren?.find(
    child => child.type === PlayerMenuLabelName,
  );
  const menuItems = wegasChildren?.find(
    child => child.type === PlayerMenuItemsName,
  );

  if (menuLabel && menuItems) {
    const items = menuItems.props.children?.reduce<MenuChildren>(
      (o, child, i) => {
        const newPath = [...path, 1, i];
        const menuChildProps = child.props as MenuItemProps;
        return {
          ...o,
          [menuChildProps.childrenComponentId]: {
            label: menuChildProps.childrenComponentLabel,
            content: (
              <PageDeserializer
                key={JSON.stringify(newPath)}
                pageId={pageId}
                path={newPath}
                uneditable={uneditable}
                context={context}
                containerPropsKeys={containerPropsKeys}
                dropzones={{ center: true }}
                inheritedOptionsState={inheritedOptionsState}
              />
            ),
            index: menuChildProps.childrenComponentIndex,
          },
        };
      },
      {},
    );

    if (
      editMode &&
      (menuItems.props.children == null ||
        menuItems.props.children.length === 0)
    ) {
      return (
        <EmptyComponentContainer Container={FlexItem} path={[...path, 1]} />
      );
    } else {
      const labelChildren = menuLabel.props.children?.slice(0);
      const labelPath = [...path, 0, 0];
      return (
        <Menu
          labelFN={
            labelChildren && labelChildren.length > 0
              ? item => (
                  <MenuLabel
                    pageId={pageId}
                    path={labelPath}
                    uneditable={uneditable}
                    editMode={editMode}
                    context={context}
                    containerPropsKeys={containerPropsKeys}
                    inheritedOptionsState={inheritedOptionsState}
                    item={item}
                  />
                )
              : undefined
          }
          vertical={vertical}
          items={items || {}}
        />
      );
    }
  } else {
    return <pre>ERROR</pre>;
  }
}

registerComponent(
  pageComponentFactory({
    component: PlayerMenu,
    componentType: 'Layout',
    container: {
      isVertical,
      ChildrenDeserializer: ChildrenDeserializer,
    },
    dropzones: {},
    name: 'Menu',
    icon: 'bars',
    illustration: 'menu',
    schema: { ...menuSchema, ...classStyleIdShema },
    getComputedPropsFromVariable: () => ({
      children: [
        { type: PlayerMenuLabelName, props: { children: [] } },
        { type: PlayerMenuItemsName, props: { children: [] } },
      ],
    }),
    behaviour: {
      allowChildren: () => false,
    },
  }),
);
