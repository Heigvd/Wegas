import * as React from 'react';
import { css, cx } from 'emotion';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { omit } from 'lodash';
import u from 'immer';
import { ReparentableRoot } from '../Reparentable';
import { DnDTabLayout, ComponentMap, filterMap } from './DnDTabLayout';
import { wlog } from '../../../Helper/wegaslog';

import 'react-reflex/styles.css';
import { flex, noOverflow, grow } from '../../../css/classes';
import { themeVar } from '../../../Components/Style/ThemeVars';
import { AvailableLayoutTab } from '../Layout';

export const splitter = css({
  '&.reflex-container > .reflex-splitter': {
    backgroundColor: themeVar.Common.colors.MainColor,
    zIndex: 0,
  },
  '&.reflex-container > .reflex-splitter:hover': {
    backgroundColor: themeVar.Common.colors.MainColor,
  },
  '&.reflex-container.vertical > .reflex-splitter': {
    width: '5px',
    borderLeft: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    borderRight: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
  },
  '&.reflex-container.horizontal > .reflex-splitter': {
    height: '5px',
    borderTop: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    borderBottom: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
  },
  '&.reflex-container.vertical > .reflex-splitter:hover': {
    borderLeft: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    borderRight: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
  },
  '&.reflex-container.horizontal > .reflex-splitter:hover': {
    borderTop: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    borderBottom: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
  },
});

export const focusTabContext = React.createContext<
  (id: AvailableLayoutTab, layoutId: string) => void
>(() => undefined);

type LayoutType = 'ReflexLayoutNode' | 'TabLayoutNode';

/**
 * A layout node, can be a reflexLayout or a tabLayout is used by the linearLayout
 */
interface LayoutNode {
  /**
   * type - The layout type
   */
  type: LayoutType;
  /**
   * vertical - the orientation of the layout
   */
  vertical: boolean;
  /**
   * children - the children keys
   * type :
   *  - ReflexLayout : keys are from LayoutNode in the LayoutMap
   *  - TabLayout : labels are from Tabs in the TabsMap
   */
  children: string[];
  /**
   * flex - the proportion of the layout
   */
  flex?: number;

  /**
   * flexValues - the flex values of the content
   */
  flexValues: number[];

  /**
   * defaultActive - the label of the active children
   */
  defaultActive?: string;
}

interface LayoutMap {
  [id: string]: LayoutNode;
}

interface ManagedLayoutMap {
  /**
   * rootKey - the key of the root layout
   */
  rootKey: string;
  /**
   * lastKey - the last inserted key (allows dynamic modification when keys are integers)
   */
  lastKey: string;
  /**
   * layoutMap - the current layout disposition
   */
  layoutMap: LayoutMap;
}

/**
 * getUnusedTabs allows to find all unused tabs in the linearLayout
 *
 * @param layouts - the current layout disposition
 * @param tabs - the tabs that can be used in the linearLayout
 *
 * @returns every unused tabs in a tabMap
 */
const getUnusedTabs = (layouts: LayoutMap, tabs: ComponentMap) => {
  return filterMap(tabs, label => {
    return (
      Object.keys(layouts).filter(layoutKey => {
        const layout = layouts[layoutKey];
        return (
          layout.type === 'TabLayoutNode' && layout.children.indexOf(label) >= 0
        );
      }).length === 0
    );
  });
};

/**
 * makeTabMap simply makes a tab map from a list of labels
 *
 * @param labels - the names of the tabs to be used
 * @param tabs - the tabs that can be used in the linearLayout
 *
 * @returns a map of the tabs corresponding to the given labels
 */
const makeTabMap = (labels: string[], tabs: ComponentMap) => {
  const newTabs: ComponentMap = {};
  for (const label of labels) {
    newTabs[label] = tabs[label];
  }
  return newTabs;
};

/**
 * findTabLayoutKeyByTabKey allows to find the parent tabLayout and the index of the tab
 *
 * @param layouts - the current layout disposition
 * @param key - the key of the searched tab or layout
 * @param type - the type of parent (ReflexLayout for laoyuts and TabLayout for tabs)
 *
 * @returns null if nothing found or the parentKey and the childIndex
 */
const findLayoutByKey = (layouts: LayoutMap, key: string, type: LayoutType) => {
  for (const layoutKey in layouts) {
    const layout = layouts[layoutKey];
    if (layout.type === type) {
      const layoutIndex = layout.children.indexOf(key);
      if (layoutIndex >= 0) {
        return {
          parentKey: layoutKey,
          childIndex: layoutIndex,
        };
      }
    }
  }
  return null;
};

/**
 * removeLayoutFromLayouts allows to remove recursively a layout
 * as it check for empty parent layouts and remove them too
 *
 * @param layouts - the current layout disposition
 * @param layoutKey - the key of the layout to remove
 *
 * @returns the new layout disposition
 *
 * @example
 * Example :
 * ==> Init
 * {
 *  '1' : ReflexLayout::children : {
 *    '2': ReflexLayout::children : {
 *      '3':TabLayout,
 *      '4':Tablayout,
 *    },
 *    '5': ReflexLayout::children : {
 *      '6':Tablayout,
 *      '7':Tablayout,
 *    },
 *  },
 * }
 *
 * ==> removeLayout('7')
 * ==> phase REMOVE
 *  {
 *  '1' : ReflexLayout::children : {
 *    '2': ReflexLayout::children : {
 *      '3':TabLayout,
 *      '4':TabLayout,
 *    },
 *    '5': ReflexLayout::children : {
 *      '6':TabLayout,
 *    },
 *  },
 * }
 * ==> Now TabLayout #6 is alone in the ReflexLayout #5, we have to remove 5 and put 6 in 1
 * ==> phase CLEAN
 *  {
 *  '1' : ReflexLayout::children : {
 *    '2': ReflexLayout::children : {
 *      '3':TabLayout,
 *      '4':Tablayout,
 *    },
 *    '6': Tablayout,
 *  },
 * }
 */
const removeLayout = (layouts: LayoutMap, layoutKey: string) => {
  let newLayout = omit(layouts, layoutKey);
  for (const key in newLayout) {
    const layout = newLayout[key];
    if (layout.type === 'ReflexLayoutNode') {
      const layoutKeyIndex = layout.children.indexOf(layoutKey);
      if (layoutKeyIndex >= 0) {
        newLayout[key].children.splice(layoutKeyIndex, 1);
        if (newLayout[key].children.length === 0) {
          newLayout = removeLayout(newLayout, key);
        } else {
          newLayout = checkAndCleanLonelyLayout(newLayout, key);
        }
        return newLayout;
      }
    }
  }
  return newLayout;
};

/**
 * checkAndCleanLonelyLayout looks for single parent layout with a single child, remove the parent and put the child in the parent parent
 *
 * @param layouts - the current layout disposition
 * @param layoutKey - the key of the layout to check
 *
 * @returns the cleaned layout disposition
 *
 * @example
 * look at the example for the @function removeLayout
 *
 */
const checkAndCleanLonelyLayout = (
  layouts: LayoutMap,
  layoutKey: string,
): LayoutMap => {
  let newLayouts = layouts;
  const lonelyLayout = newLayouts[layoutKey];
  const parentLayoutInfo = findLayoutByKey(
    layouts,
    layoutKey,
    'ReflexLayoutNode',
  );
  if (parentLayoutInfo) {
    const parentLayout = layouts[parentLayoutInfo.parentKey];
    if (
      parentLayout.type === 'ReflexLayoutNode' &&
      lonelyLayout.type === 'ReflexLayoutNode' &&
      lonelyLayout.children.length === 1
    ) {
      //Replace lonely layout parent with lonely layout
      newLayouts[parentLayoutInfo.parentKey].children.splice(
        parentLayoutInfo.childIndex,
        1,
        lonelyLayout.children[0],
      );

      newLayouts = removeLayout(newLayouts, layoutKey);
    }
  } else {
    // This mean that the key is either not in use or the root key
    // Let's check if the key exists and if it has only one children
    const rootLayout = newLayouts[layoutKey];
    if (rootLayout && rootLayout.children.length === 1) {
      // Now let's check if the children exists and is also a ReflexLayoutNode
      const childLayoutKey = rootLayout.children[0];
      const childLayout = newLayouts[childLayoutKey];
      if (childLayout && childLayout.type === 'ReflexLayoutNode') {
        // Let's swap the content of the child in the root layout and delete the child
        newLayouts[layoutKey].children = childLayout.children;
        newLayouts = omit(newLayouts, childLayoutKey);
      }
    }
  }
  return newLayouts;
};

/**
 * checkAndCleanMissOrientedLayouts check the whole disposition for two ReflexLayout (parent child) with the same orientation
 * If found, put the children in the parent parent and remove the parent
 *
 * @param layouts - the current layout disposition
 *
 * @returns the cleaned layout disposition
 *
 * @example
 * look at the example for the @function removeLayout
 *
 */
const checkAndCleanMissOrientedLayouts = (layouts: LayoutMap) => {
  let newLayouts = layouts;
  const keys = Object.keys(layouts);
  for (const key of keys) {
    if (layouts[key].type === 'ReflexLayoutNode') {
      const parentLayoutInfo = findLayoutByKey(
        layouts,
        key,
        'ReflexLayoutNode',
      );
      if (
        parentLayoutInfo &&
        layouts[key].vertical === layouts[parentLayoutInfo.parentKey].vertical
      ) {
        //Merge children in parent layout
        newLayouts[parentLayoutInfo.parentKey].children.splice(
          parentLayoutInfo.childIndex,
          0,
          ...layouts[key].children,
        );
        //Remove missoriented layout
        newLayouts = removeLayout(newLayouts, key);
      }
    }
  }
  return newLayouts;
};

/**
 * createLayout creates and insert a new layout
 *
 * @param layouts - the current layout disposition
 * @param type - the type of layout to be created
 * @param children - the children of the layout
 * @param vertical - the orientation of the layout
 *
 * @returns the new layout disposition
 */
const createLayout = (
  layouts: ManagedLayoutMap,
  type: LayoutType,
  children: string[] = [],
  vertical: boolean = false,
) => {
  const newLayouts = layouts;
  newLayouts.lastKey = incrementNumericKey(newLayouts.lastKey);
  const newLayoutKey = newLayouts.lastKey;
  newLayouts.layoutMap[newLayoutKey] = {
    type: type,
    vertical: vertical,
    children: children,
    flexValues: [],
  };

  return newLayouts;
};

/**
 * incrementNumericKey helper function to increment a numeric key stored as string
 *
 * @param key - the numeric string to increment
 */
const incrementNumericKey = (key: string, increment: number = 1) => {
  const numericKey = Number(key);
  if (isNaN(numericKey)) {
    return key;
  } else {
    return String(numericKey + increment);
  }
};

/**
 * logLayouts displays a clean and formatted log of the layout disposition
 *
 * @param layouts
 */
// @ts-ignore
const logLayouts = (layouts: LayoutMap) => {
  wlog(
    'layouts',
    Object.keys(layouts).map(key => {
      const layout = layouts[key];
      return (
        key +
        ' ' +
        layout.type +
        ' [' +
        String(layout.children + '] ==> ' + layout.defaultActive)
      );
    }),
  );
};

/**
 * insertTab insert a tab in a TabLayout
 * Be carefull here, there is no verification if a tab is inserted into a tabLayout
 *
 * @param layouts - the current layout disposition
 * @param destLayoutKey - the destination layout key
 * @param key - the key of the tab or layout to be inserted
 *
 * @returns the new layout disposition
 */
const insertChildren = <T extends LayoutMap>(
  layouts: T,
  destLayoutKey: keyof T,
  key: string,
  index?: number,
  active?: boolean,
) => {
  const newLayouts = layouts;
  const newIndex =
    index !== undefined ? index : newLayouts[destLayoutKey].children.length;
  newLayouts[destLayoutKey].children.splice(newIndex, 0, key);
  if (active) {
    newLayouts[destLayoutKey].defaultActive = key;
  }
  return newLayouts;
};

const insertNewLayout = <T extends ManagedLayoutMap>(
  layouts: T,
  type: LayoutType,
  destLayoutKey?: keyof T['layoutMap'],
  children: string[] = [],
  index?: number,
  vertical?: boolean,
  active?: boolean,
) => {
  const destKey = destLayoutKey !== undefined ? destLayoutKey : layouts.lastKey;
  const parentLayout = layouts.layoutMap[destKey as string];
  let vert: boolean;
  if (vertical === undefined) {
    if (type !== 'TabLayoutNode') {
      vert = !parentLayout.vertical;
    } else {
      vert = false;
    }
  } else {
    vert = vertical;
  }
  const newLayouts = createLayout(layouts, type, children, vert);
  const key = newLayouts.lastKey;
  newLayouts.layoutMap = insertChildren(
    newLayouts.layoutMap,
    String(destKey),
    key,
    index,
    active,
  );
  return newLayouts;
};

interface Action {
  type: string;
}

interface TabAction<T extends ComponentMap> extends Action {
  tabKey: keyof T;
}

interface ActionDelete<T extends ComponentMap> extends TabAction<T> {
  type: 'DELETE';
}

interface ActionSelect<T extends ComponentMap> extends TabAction<T> {
  type: 'SELECT';
}

interface ActionExternalSelect<T extends ComponentMap> extends TabAction<T> {
  type: 'EXTERNALSELECT';
}

export type DropActionType = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'NEW';

interface ActionDrop<T extends ComponentMap> extends TabAction<T> {
  type: DropActionType;
  destTabLayoutKey: string;
}

interface ActionDropTab<T extends ComponentMap> extends TabAction<T> {
  type: 'TAB';
  parentKey: string;
  tabIndex: number;
}

interface ActionResize extends Action {
  type: 'RESIZE';
  layoutKey: string;
  flex?: number;
}

interface ActionFlexResize extends Action {
  type: 'FLEX-RESIZE';
  layoutKey: string;
  flexValues: number[];
}

type TabLayoutsAction<T extends ComponentMap> =
  | ActionDrop<T>
  | ActionDelete<T>
  | ActionDropTab<T>
  | ActionSelect<T>
  | ActionExternalSelect<T>
  | ActionResize
  | ActionFlexResize;

/**
 * setLayout is the reducer function for layout disposition management
 */
const setLayout = (layoutAccept: string) => <T extends ManagedLayoutMap>(
  layouts: T,
  action: TabLayoutsAction<T['layoutMap']>,
) =>
  u(layouts, (layouts: ManagedLayoutMap) => {
    let newLayouts = layouts;
    // If a layout has been resized, save it in the state
    if (action.type === 'RESIZE') {
      newLayouts.layoutMap[action.layoutKey].flex = action.flex;
    } else if (action.type === 'FLEX-RESIZE') {
      newLayouts.layoutMap[action.layoutKey].flexValues = action.flexValues;
    }
    // If new action, simply insert the new tab in the dest tabLayout
    else {
      // Find the parent tabLayout of the tab
      const srcTabLayoutKey = findLayoutByKey(
        newLayouts.layoutMap,
        action.tabKey as string,
        'TabLayoutNode',
      );

      if (action.type === 'NEW') {
        newLayouts.layoutMap = insertChildren(
          newLayouts.layoutMap,
          action.destTabLayoutKey,
          action.tabKey as string,
          undefined,
          true,
        );
      }
      // If the selection come from the oustide of the component (selectContext) and the tab is not in use
      else if (action.type === 'EXTERNALSELECT' && !srcTabLayoutKey) {
        // Create a new tabLayout and insert the selected tab in it
        newLayouts = createLayout(
          newLayouts,
          'TabLayoutNode',
          [action.tabKey as string],
          false,
        );
        // Insert the new tabLayout in the root layout
        newLayouts.layoutMap = insertChildren(
          newLayouts.layoutMap,
          newLayouts.rootKey,
          newLayouts.lastKey,
          undefined,
          true,
        );
      }
      // For the other actions, the tab must have a parent tabLayout
      else if (srcTabLayoutKey) {
        if (action.type === 'SELECT' || action.type === 'EXTERNALSELECT') {
          newLayouts.layoutMap[
            srcTabLayoutKey.parentKey
          ].defaultActive = action.tabKey as string;
          return newLayouts;
        }
        // Remaining actions are drop actions, always remove tab from source TabLayout when dropping
        const oldTabLayout = newLayouts.layoutMap[srcTabLayoutKey.parentKey];
        oldTabLayout.children = oldTabLayout.children.filter(
          el => el !== action.tabKey,
        );
        newLayouts.layoutMap[srcTabLayoutKey.parentKey] = oldTabLayout;

        // Dropping in the tab bar
        if (action.type === 'TAB') {
          // If the dragged tab came from the same tab bar, decrement index by 1 to take it's own position into account
          let index = action.tabIndex;
          if (
            action.parentKey === srcTabLayoutKey.parentKey &&
            action.tabIndex > srcTabLayoutKey.childIndex
          ) {
            index -= 1;
          }

          // Insert the tab at the right position
          newLayouts.layoutMap = insertChildren(
            newLayouts.layoutMap,
            action.parentKey,
            action.tabKey as string,
            index,
            true,
          );
        } else if (action.type !== 'DELETE') {
          // Getting the parent of the TabLayout
          const destParentInfo = findLayoutByKey(
            newLayouts.layoutMap,
            action.destTabLayoutKey,
            'ReflexLayoutNode',
          );

          // This is always true because a tabLayout has to have a parent reflexLayout
          if (destParentInfo) {
            const dstParentKey = destParentInfo.parentKey;
            const dstParentLayout = newLayouts.layoutMap[dstParentKey];
            const isNewLayoutInside =
              (dstParentLayout.vertical &&
                (action.type === 'LEFT' || action.type === 'RIGHT')) ||
              (!dstParentLayout.vertical &&
                (action.type === 'TOP' || action.type === 'BOTTOM'));

            // Create a new tabLayout and insert the dragged tab in it
            newLayouts = createLayout(
              newLayouts,
              'TabLayoutNode',
              [action.tabKey as string],
              false,
            );
            const newTabLayoutKey = newLayouts.lastKey;

            if (isNewLayoutInside) {
              /*
               * If the tab is not inserted in the orientation of the parent parent layout
               * EX :
               *  +-------+
               *  |   1   |
               *  +-------+
               *  |   2   | <= insert new layout (3) here on the right
               *  +-------+
               *
               *  +-------+
               *  |   1   |
               *  +-------+
               *  |  ==>  |  <= First create an horizontal layout
               *  +-------+
               *
               *  +-------+
               *  |   1   |
               *  +---+---+
               *  | 2 | 3 | <= Then insert old layout (2) and new one (3)
               *  +-------+
               */
              // Detect if the new layout is placed first or last
              const newParentChildren =
                action.type === 'LEFT' || action.type === 'TOP'
                  ? [newTabLayoutKey, action.destTabLayoutKey]
                  : [action.destTabLayoutKey, newTabLayoutKey];
              // Create new layout and insert it at the position of the old layout
              newLayouts = createLayout(
                newLayouts,
                'ReflexLayoutNode',
                newParentChildren,
                !dstParentLayout.vertical,
              );
              const newReflexLayoutKey = newLayouts.lastKey;
              newLayouts.layoutMap = insertChildren(
                newLayouts.layoutMap,
                dstParentKey,
                newReflexLayoutKey,
                destParentInfo.childIndex,
              );

              // Remove destinationLayout from parent layout as it's now wrapped in a new layout
              newLayouts.layoutMap[
                dstParentKey
              ].children = newLayouts.layoutMap[dstParentKey].children.filter(
                el => el !== action.destTabLayoutKey,
              );
            } else {
              /*
               * If the tab is inserted in the orientation  of the parent parent layout
               * EX :
               *  +-------+
               *  |   1   |
               *  +-------+
               *  |   2   |  <= insert new layout (3) here on the bottom
               *  +-------+
               *
               *  +-------+
               *  |   1   |
               *  +-------+
               *  |   2   |
               *  +-------+ <= simply insert the new layout as new children of the parent parent layout
               *  |   3   |
               *  +-------+
               */
              // Insert new tabLayout
              const newLayoutIndex =
                action.type === 'RIGHT' || action.type === 'BOTTOM'
                  ? destParentInfo.childIndex + 1
                  : destParentInfo.childIndex;
              newLayouts.layoutMap = insertChildren(
                newLayouts.layoutMap,
                dstParentKey,
                newTabLayoutKey,
                newLayoutIndex,
              );
            }
          }
        }

        // If the source tabLayout is empty, remove it
        if (
          newLayouts.layoutMap[srcTabLayoutKey.parentKey].children.length === 0
        ) {
          newLayouts.layoutMap = removeLayout(
            newLayouts.layoutMap,
            srcTabLayoutKey.parentKey,
          );
        }
        // Check for misorientation after deleting and reordering the layouts
        newLayouts.layoutMap = checkAndCleanMissOrientedLayouts(
          newLayouts.layoutMap,
        );
      }
    }
    // Saving layout in local storage
    window.localStorage.setItem(
      `DnDGridLayoutData.${layoutAccept}`,
      JSON.stringify(newLayouts),
    );
    return newLayouts;
  });

const defaultLayout: ManagedLayoutMap = {
  lastKey: '0',
  layoutMap: {
    '0': {
      type: 'ReflexLayoutNode',
      children: [],
      vertical: false,
      flexValues: [],
    },
  },
  rootKey: '0',
};

const reduceChildren = <T extends ComponentMap>(
  children?: LayoutItems<T>,
  layoutMap?: ManagedLayoutMap,
) => {
  let newLayoutMap: ManagedLayoutMap = layoutMap
    ? layoutMap
    : // Deepcopy
      JSON.parse(JSON.stringify(defaultLayout));
  const key = newLayoutMap.lastKey;
  if (children && children.length > 0) {
    if (typeof children[0] === 'string') {
      newLayoutMap = insertNewLayout(
        newLayoutMap,
        'TabLayoutNode',
        key,
        children as string[],
      );
    } else {
      for (const child of children) {
        newLayoutMap = insertNewLayout(newLayoutMap, 'ReflexLayoutNode', key);
        newLayoutMap = reduceChildren(child as LayoutItems<T>, newLayoutMap);
      }
    }
  }
  return newLayoutMap;
};

const layoutTabMissing = (layout: LayoutMap | null, tabs: ComponentMap) =>
  !layout ||
  Object.values(layout).some(
    item =>
      item.type === 'TabLayoutNode' &&
      item.children.some(c => !Object.keys(tabs).includes(c)),
  );

// eslint-disable-next-line
interface LayoutItem<T extends ComponentMap>
  extends Array<LayoutItem<T> | keyof T> {}
type LayoutItems<T extends ComponentMap> = LayoutItem<T> | LayoutItem<T>[];

interface LinearLayoutProps<T extends ComponentMap> {
  /**
   * tabs - The tabs that can be used in the layout (You must include all the tabs that you use in the children)
   */
  tabs: T;
  /**
   * layout - the layout initial disposition
   * If a layout is saved in the browser, this won't be taken in account unless the saved layout is reset
   */
  layout?: LayoutItems<T>;
  /**
   * layoutId - The token that filter the drop actions
   */
  layoutId: string;
  /**
   * onFocusTab - Allows to pass back the focusTab function without using a context
   */
  onFocusTab?: (focusTab: (tabId: string, layoutId: string) => void) => void;
}

/**
 * MainLinearLayout is a component that allows to chose the position and size of its children
 */
export function MainLinearLayout<T extends ComponentMap>(
  props: LinearLayoutProps<T>,
) {
  const tabs = React.useRef<ComponentMap>(props.tabs ? props.tabs : {});
  const savedLayoutJSON = window.localStorage.getItem(
    `DnDGridLayoutData.${props.layoutId}`,
  );
  const savedLayout = savedLayoutJSON
    ? (JSON.parse(savedLayoutJSON) as ManagedLayoutMap)
    : null;
  const [layout, dispatchLayout] = React.useReducer(
    setLayout(props.layoutId),
    savedLayout && !layoutTabMissing(savedLayout.layoutMap, tabs.current)
      ? savedLayout
      : reduceChildren(props.layout),
  );

  const onDrop = (layoutKey: string) => (type: DropActionType) => (item: {
    label: string;
    type: string;
  }) => {
    dispatchLayout({
      type: type,
      destTabLayoutKey: layoutKey,
      tabKey: item.label,
    });
  };

  const onDropTab = (parentLayoutKey: string) => (index: number) => (item: {
    label: string;
    type: string;
  }) =>
    dispatchLayout({
      type: 'TAB',
      parentKey: parentLayoutKey,
      tabKey: item.label,
      tabIndex: index,
    });

  const onDeleteTab = (tabkey: string) =>
    dispatchLayout({
      type: 'DELETE',
      tabKey: tabkey,
    });

  const onNewTab = (layoutKey: string) => (tabKey: string) =>
    dispatchLayout({
      type: 'NEW',
      tabKey: tabKey,
      destTabLayoutKey: layoutKey,
    });

  const onSelect = (tabKey: string) =>
    dispatchLayout({
      type: 'SELECT',
      tabKey: tabKey,
    });

  const focusTab = React.useCallback(
    (id: string, layoutId: string) => {
      if (props.layoutId === layoutId) {
        dispatchLayout({ type: 'EXTERNALSELECT', tabKey: id });
      }
    },
    [props.layoutId],
  );

  React.useEffect(() => {
    props.onFocusTab && props.onFocusTab(focusTab);
  }, [props, focusTab]);

  /**
   * renderLayouts is a recursvie function that renders the linearLayout.
   * This function creates a reflexLayout or a tabLayout component depending on the layout type
   * then if the layout is reflex and have children it calls itself to render the children the same way
   *
   * @param layoutKey - the key of the layout to display
   */
  const renderLayouts = (layoutKey?: string) => {
    const currentLayoutKey = layoutKey ? layoutKey : layout.rootKey;
    const currentLayout = layout.layoutMap[currentLayoutKey];
    if (currentLayout) {
      switch (currentLayout.type) {
        case 'TabLayoutNode': {
          return (
            <DnDTabLayout
              key={currentLayoutKey}
              components={makeTabMap(currentLayout.children, tabs.current)}
              selectItems={getUnusedTabs(layout.layoutMap, tabs.current)}
              vertical={currentLayout.vertical}
              onDrop={onDrop(currentLayoutKey)}
              onDropTab={onDropTab(currentLayoutKey)}
              onDeleteTab={onDeleteTab}
              onNewTab={onNewTab(currentLayoutKey)}
              defaultActiveLabel={currentLayout.defaultActive}
              onSelect={onSelect}
              layoutId={props.layoutId}
            />
          );
        }
        case 'ReflexLayoutNode': {
          const rendered: JSX.Element[] = [];
          for (let i = 0; i < currentLayout.children.length; i += 1) {
            const childKey = currentLayout.children[i];
            rendered.push(
              <ReflexElement
                key={childKey}
                flex={
                  layout.layoutMap[childKey].flex
                    ? layout.layoutMap[childKey].flex
                    : 1000
                }
                onStopResize={({ component }) =>
                  dispatchLayout({
                    type: 'RESIZE',
                    layoutKey: childKey,
                    flex: component.props.flex,
                  })
                }
                minSize={50}
                className={cx(flex, noOverflow)}
              >
                {renderLayouts(childKey)}
              </ReflexElement>,
            );
            if (i < currentLayout.children.length - 1) {
              rendered.push(<ReflexSplitter key={childKey + 'SEPARATOR'} />);
            }
          }
          return (
            <ReflexContainer
              className={splitter}
              // Orientation is inverted to keep same logic in TabLayoutNode and ReflexLayoutNode (vertical==true : v, vertical==false : >)
              orientation={currentLayout.vertical ? 'horizontal' : 'vertical'}
            >
              {rendered.length === 0 ? (
                <ReflexElement>
                  <div>Loading...</div>
                </ReflexElement>
              ) : (
                rendered
              )}
            </ReflexContainer>
          );
        }
      }
    } else {
      return (
        <ReflexContainer>
          <ReflexElement>
            <div>Nothing inside</div>
          </ReflexElement>
        </ReflexContainer>
      );
    }
  };

  // /**
  //  * renderLayouts is a recursvie function that renders the linearLayout.
  //  * This function creates a reflexLayout or a tabLayout component depending on the layout type
  //  * then if the layout is reflex and have children it calls itself to render the children the same way
  //  *
  //  * @param layoutKey - the key of the layout to display
  //  */
  // const renderLayouts = (layoutKey?: string) => {
  //   const currentLayoutKey = layoutKey ? layoutKey : layout.rootKey;
  //   const currentLayout = layout.layoutMap[currentLayoutKey];
  //   if (currentLayout) {
  //     switch (currentLayout.type) {
  //       case 'TabLayoutNode': {
  //         return (
  //           <DnDTabLayout
  //             key={currentLayoutKey}
  //             components={makeTabMap(currentLayout.children, tabs.current)}
  //             selectItems={getUnusedTabs(layout.layoutMap, tabs.current)}
  //             vertical={currentLayout.vertical}
  //             onDrop={onDrop(currentLayoutKey)}
  //             onDropTab={onDropTab(currentLayoutKey)}
  //             onDeleteTab={onDeleteTab}
  //             onNewTab={onNewTab(currentLayoutKey)}
  //             defaultActiveLabel={currentLayout.defaultActive}
  //             onSelect={onSelect}
  //             layoutId={props.layoutId}
  //           />
  //         );
  //       }
  //       case 'ReflexLayoutNode': {
  //         const rendered: JSX.Element[] = [];
  //         for (let i = 0; i < currentLayout.children.length; i += 1) {
  //           const childKey = currentLayout.children[i];
  //           rendered.push(
  //             <Content
  //               key={childKey}
  //               // flex={
  //               //   layout.layoutMap[childKey].flex
  //               //     ? layout.layoutMap[childKey].flex
  //               //     : 1000
  //               // }
  //               flexInit={
  //                 layout.layoutMap[childKey].flexValues
  //                   ? layout.layoutMap[childKey].flexValues[i]
  //                   : undefined
  //               }
  //               // onStopResize={({ component }) =>
  //               //   dispatchLayout({
  //               //     type: 'RESIZE',
  //               //     layoutKey: childKey,
  //               //     flex: component.props.flex,
  //               //   })
  //               // }
  //               // minSize={50}
  //               className={cx(flex, noOverflow)}
  //             >
  //               {renderLayouts(childKey)}
  //             </Content>,
  //           );
  //           if (i < currentLayout.children.length - 1) {
  //             rendered.push(<Splitter key={childKey + 'SEPARATOR'} />);
  //           }
  //         }
  //         return (
  //           <Container
  //             className={splitter}
  //             vertical={currentLayout.vertical}
  //             onStopResize={(_splitter, flexValues) =>
  //               dispatchLayout({
  //                 type: 'FLEX-RESIZE',
  //                 layoutKey: currentLayoutKey,
  //                 flexValues,
  //               })
  //             }
  //           >
  //             {rendered}
  //           </Container>
  //         );
  //       }
  //     }
  //   }
  // };

  return (
    <focusTabContext.Provider value={focusTab}>
      <ReparentableRoot>
        <div className={cx(flex, grow)}>{renderLayouts()}</div>
      </ReparentableRoot>
    </focusTabContext.Provider>
  );
}

/**
 * DndLinearLayout is a wrapper that calls the MainLinearLayout in the shared HTML5 context
 * Multiple context for react-dnd is not allowed
 */
export function DndLinearLayout<T extends ComponentMap>(
  props: LinearLayoutProps<T>,
) {
  return (
    <DefaultDndProvider>
      <MainLinearLayout {...props} />
    </DefaultDndProvider>
  );
}
