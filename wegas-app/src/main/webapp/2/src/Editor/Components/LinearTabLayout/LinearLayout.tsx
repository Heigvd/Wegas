import * as React from 'react';
import { css } from 'emotion';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import 'react-reflex/styles.css';
import { DnDTabLayout } from './DnDTabs';
import StateMachineEditor from '../StateMachineEditor';
import PageDisplay from '../Page/PageDisplay';
import TreeView from './../Variable/VariableTree';
import { defaultContextManager } from '../../../Components/DragAndDrop';
import Editor from './../EntityEditor';
import { omit } from 'lodash';
import u from 'immer';

const splitter = css({
  '&.reflex-container.vertical > .reflex-splitter': {
    width: '5px',
  },
  '&.reflex-container.horizontal > .reflex-splitter': {
    height: '5px',
  },
});

const flex = css({
  display: 'flex',
  flex: '1 1 auto',
});

export interface LinearLayoutComponent {
  name: string;
  component: JSX.Element;
}

export interface LinearLayoutComponentMap {
  [id: string]: LinearLayoutComponent;
}

interface Tab {
  name: string;
  component: JSX.Element;
}

interface TabsMap {
  [id: string]: Tab;
}

const defaultTabsMap: TabsMap = {
  '0': {
    name: 'Variables',
    component: <TreeView />,
  },
  '1': {
    name: 'Page',
    component: <PageDisplay />,
  },
  '2': {
    name: 'StateMachine',
    component: <StateMachineEditor />,
  },
  '3': {
    name: 'Editor',
    component: <Editor />,
  },
  '4': {
    name: 'Page2',
    component: <PageDisplay />,
  },
};

type LayoutType = 'ReflexLayoutNode' | 'TabLayoutNode';

interface LayoutNode {
  type: LayoutType;
  vertical: boolean;
  children: string[];
}

interface LayoutMap {
  [id: string]: LayoutNode | LayoutNode;
}

interface ManagedLayoutMap {
  rootKey: string;
  lastKey: string;
  draggedKey: string;
  layoutMap: LayoutMap;
}

const getUnusedTabs = (layouts: LayoutMap, tabs: TabsMap) => {
  const unusedTabsKeys = Object.keys(tabs).filter(tabKey => {
    return (
      Object.keys(layouts).filter(layoutKey => {
        const layout = layouts[layoutKey];
        return (
          layout.type === 'TabLayoutNode' &&
          layout.children.indexOf(tabKey) >= 0
        );
      }).length === 0
    );
  });
  return unusedTabsKeys.map(tabKey => {
    return {
      label: tabs[tabKey].name,
      value: Number(tabKey),
    };
  });
};

const defaultLayoutMap: ManagedLayoutMap = {
  rootKey: '0',
  lastKey: '5',
  draggedKey: '-1',
  layoutMap: {
    '0': {
      type: 'ReflexLayoutNode',
      vertical: false,
      children: ['1', '2', '3'],
    },
    '1': {
      type: 'TabLayoutNode',
      vertical: false,
      children: ['0'],
    },
    '2': {
      type: 'TabLayoutNode',
      vertical: false,
      children: ['1', '2'],
    },
    '3': {
      type: 'ReflexLayoutNode',
      vertical: true,
      children: ['4', '5'],
    },
    '4': {
      type: 'TabLayoutNode',
      vertical: false,
      children: ['3'],
    },
    '5': {
      type: 'TabLayoutNode',
      vertical: false,
      children: ['4'],
    },
  },
};

const findTabLayoutKeyByTabKey = (layouts: LayoutMap, tabKey: string) => {
  for (const layoutKey in layouts) {
    const layout = layouts[layoutKey];
    if (layout.type === 'TabLayoutNode') {
      for (const tabIndex in layout.children) {
        if (layout.children[tabIndex] === tabKey) {
          return layoutKey;
        }
      }
    }
  }
  return null;
};

const findParentLayoutKeyAndLayoutIndex = (
  layouts: LayoutMap,
  layoutKey: string,
) => {
  for (const key in layouts) {
    const layout = layouts[key];
    if (layout.type === 'ReflexLayoutNode') {
      const layoutIndex = layout.children.indexOf(layoutKey);
      if (layout.children.indexOf(layoutKey) >= 0) {
        return {
          parentKey: key,
          childIndex: layoutIndex,
        };
      }
    }
  }
  return null;
};

const removeLayoutFromLayouts = (layouts: LayoutMap, layoutKey: string) => {
  let newLayout = omit(layouts, layoutKey);
  for (const key in newLayout) {
    const layout = newLayout[key];
    if (layout.type === 'ReflexLayoutNode') {
      const layoutKeyIndex = layout.children.indexOf(layoutKey);
      if (layoutKeyIndex >= 0) {
        newLayout[key].children.splice(layoutKeyIndex, 1);
        if (newLayout[key].children.length === 0) {
          newLayout = removeLayoutFromLayouts(newLayout, key);
        } else {
          newLayout = checkAndCleanLonelyLayout(newLayout, key);
        }
        return newLayout;
      }
    }
  }
  return newLayout;
};

const checkAndCleanLonelyLayout = (
  layouts: LayoutMap,
  lonelyLayoutKey: string,
): LayoutMap => {
  let newLayouts = layouts;
  const lonelyLayout = newLayouts[lonelyLayoutKey];
  const parentLayoutInfo = findParentLayoutKeyAndLayoutIndex(
    layouts,
    lonelyLayoutKey,
  );
  if (parentLayoutInfo) {
    const parentLayout = layouts[parentLayoutInfo.parentKey];

    if (
      parentLayout.type === 'ReflexLayoutNode' &&
      lonelyLayout.type === 'ReflexLayoutNode' &&
      lonelyLayout.children.length === 1
    ) {
      //Remove lonely layout parent
      newLayouts[parentLayoutInfo.parentKey].children.splice(
        parentLayoutInfo.childIndex,
        1,
      );

      //Insert lonely layout parent from lonelyLayout in parent parent children
      newLayouts[parentLayoutInfo.parentKey].children.splice(
        parentLayoutInfo.childIndex,
        0,
        lonelyLayout.children[0],
      );

      newLayouts = removeLayoutFromLayouts(newLayouts, lonelyLayoutKey);
    }
  }
  return newLayouts;
};

const checkAndCleanMissOrientedLayouts = (layouts: LayoutMap) => {
  let newLayouts = layouts;
  const keys = Object.keys(layouts);
  for (const key of keys) {
    if (layouts[key].type === 'ReflexLayoutNode') {
      const parentLayoutInfo = findParentLayoutKeyAndLayoutIndex(layouts, key);
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
        newLayouts = removeLayoutFromLayouts(newLayouts, key);
      }
    }
  }
  return newLayouts;
};

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
  };
  return newLayouts;
};

interface Action {
  type: string;
  tabKey: string;
}

export type DropType = 'TAB' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'NEW';

interface ActionDrop extends Action {
  type: DropType;
  destTabLayoutKey: string;
}

interface ActionDelete extends Action {
  type: 'DELETE';
}

interface ActionDrag extends Action {
  type: 'DRAG';
}

type TabLayoutsAction = ActionDrop | ActionDelete | ActionDrag;

interface Map<T> {
  [id: string]: T;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-ignore may be usefull later (if we don't want to use ommit anymore)
function deleteMapElement<T>(map: Map<T>, key: string) {
  const newMap: Map<T> = {};
  for (const mapKey in map) {
    if (mapKey !== key) {
      newMap[mapKey] = map[mapKey];
    }
  }
  return newMap;
}
/* eslint-enable */

const incrementNumericKey = (key: string) => {
  const numericKey = Number(key);
  if (isNaN(numericKey)) {
    return key;
  } else {
    return String(numericKey + 1);
  }
};

/* eslint-disable @typescript-eslint/no-unused-vars*/
/* eslint-disable no-console */
// @ts-ignore
const logLayouts = (layouts: LayoutMap) => {
  console.log(
    'layouts',
    Object.keys(layouts).map(key => [
      key,
      layouts[key].type,
      String(
        layouts[key].children.map(childKey =>
          layouts[key].type === 'TabLayoutNode' &&
          defaultTabsMap[childKey] !== undefined
            ? defaultTabsMap[childKey].name
            : childKey,
        ),
      ),
    ]),
  );
};
/* eslint-enable */

const setLayout = (layouts: ManagedLayoutMap, action: TabLayoutsAction) =>
  u(layouts, (layouts: ManagedLayoutMap) => {
    const srcTabLayoutKey = findTabLayoutKeyByTabKey(
      layouts.layoutMap,
      action.tabKey,
    );

    // reset dragged key
    layouts.draggedKey = '-1';

    if (action.type === 'NEW') {
      layouts.layoutMap[action.destTabLayoutKey].children.push(action.tabKey);
    } else if (srcTabLayoutKey) {
      if (action.type === 'DRAG') {
        layouts.draggedKey = srcTabLayoutKey;
      } else {
        // Always remove tab from source TabLayout when dropping
        layouts.layoutMap[srcTabLayoutKey].children = layouts.layoutMap[
          srcTabLayoutKey
        ].children.filter(el => el !== action.tabKey);

        if (action.type === 'TAB') {
          layouts.layoutMap[action.destTabLayoutKey].children.push(
            action.tabKey,
          );
        } else if (action.type !== 'DELETE') {
          const destParentKeyAndIndex = findParentLayoutKeyAndLayoutIndex(
            layouts.layoutMap,
            action.destTabLayoutKey,
          );

          if (destParentKeyAndIndex) {
            const dstParentKey = destParentKeyAndIndex.parentKey;
            const dstParentLayout = layouts.layoutMap[dstParentKey];

            const isNewLayoutInside =
              (dstParentLayout.vertical &&
                (action.type === 'LEFT' || action.type === 'RIGHT')) ||
              (!dstParentLayout.vertical &&
                (action.type === 'TOP' || action.type === 'BOTTOM'));

            layouts = createLayout(layouts, 'TabLayoutNode', [action.tabKey]);
            const newTabLayoutKey = layouts.lastKey;

            if (isNewLayoutInside) {
              const newParentChildren =
                action.type === 'LEFT' || action.type === 'TOP'
                  ? [newTabLayoutKey, action.destTabLayoutKey]
                  : [action.destTabLayoutKey, newTabLayoutKey];
              layouts = createLayout(
                layouts,
                'ReflexLayoutNode',
                newParentChildren,
                !dstParentLayout.vertical,
              );
              const newReflexLayoutKey = layouts.lastKey;
              layouts.layoutMap[dstParentKey].children.splice(
                destParentKeyAndIndex.childIndex,
                0,
                newReflexLayoutKey,
              );

              // Remove destinationLayout from parent layout as it's now wrapped in a new layout
              layouts.layoutMap[dstParentKey].children = layouts.layoutMap[
                dstParentKey
              ].children.filter(el => el !== action.destTabLayoutKey);
            } else {
              // Insert new tabLayout
              const newLayoutIndex =
                action.type === 'RIGHT' || action.type === 'BOTTOM'
                  ? destParentKeyAndIndex.childIndex + 1
                  : destParentKeyAndIndex.childIndex;
              layouts.layoutMap[dstParentKey].children.splice(
                newLayoutIndex,
                0,
                newTabLayoutKey,
              );
            }
          }
        }

        if (layouts.layoutMap[srcTabLayoutKey].children.length === 0) {
          layouts.layoutMap = removeLayoutFromLayouts(
            layouts.layoutMap,
            srcTabLayoutKey,
          );
        }

        layouts.layoutMap = checkAndCleanMissOrientedLayouts(layouts.layoutMap);
      }
    }
    return layouts;
  });

interface LinearLayoutProps {
  tabMap?: TabsMap;
  layoutMap?: ManagedLayoutMap;
}

function MainLinearLayout(props: LinearLayoutProps) {
  const tabs = props.tabMap ? props.tabMap : defaultTabsMap;

  const [layout, dispatchLayout] = React.useReducer(
    setLayout,
    props.layoutMap ? props.layoutMap : defaultLayoutMap,
  );

  const onDrag = (isDragging: boolean, tabKey: string) => {
    dispatchLayout({
      type: 'DRAG',
      tabKey: isDragging ? tabKey : '-1',
    });
  };

  const onDrop = (layoutKey: string) => (type: DropType) => (item: {
    id: number;
    type: string;
  }) => {
    dispatchLayout({
      type: type,
      destTabLayoutKey: layoutKey,
      tabKey: String(item.id),
    });
  };

  const onDeleteTab = (tabkey: number) => {
    dispatchLayout({
      type: 'DELETE',
      tabKey: String(tabkey),
    });
  };

  const onNewTab = (layoutKey: string) => (tabKey: number) => {
    dispatchLayout({
      type: 'NEW',
      tabKey: String(tabKey),
      destTabLayoutKey: layoutKey,
    });
  };

  const renderLayouts = (layoutKey?: string, parentKey?: string) => {
    const currentLayoutKey = layoutKey ? layoutKey : layout.rootKey;
    const currentLayout = layout.layoutMap[currentLayoutKey];
    switch (currentLayout.type) {
      case 'TabLayoutNode': {
        if (parentKey) {
          return (
            <DnDTabLayout
              tabs={currentLayout.children.map(key => {
                return {
                  id: Number(key),
                  ...tabs[key],
                };
              })}
              unusedTabs={getUnusedTabs(layout.layoutMap, tabs)}
              allowDrop={layout.draggedKey !== '-1'}
              vertical={currentLayout.vertical}
              onDrop={onDrop(currentLayoutKey)}
              onDeleteTab={onDeleteTab}
              onDrag={onDrag}
              onNewTab={onNewTab(currentLayoutKey)}
            />
          );
        } else {
          return null;
        }
      }
      case 'ReflexLayoutNode': {
        const rendered: JSX.Element[] = [];
        for (let i = 0; i < currentLayout.children.length; i += 1) {
          rendered.push(
            <ReflexElement key={currentLayout.children[i]}>
              {renderLayouts(currentLayout.children[i], currentLayoutKey)}
            </ReflexElement>,
          );
          if (i < currentLayout.children.length - 1) {
            rendered.push(
              <ReflexSplitter key={currentLayout.children[i] + 'SEPARATOR'} />,
            );
          }
        }
        return (
          <ReflexContainer
            className={splitter}
            // Orientation is inverted to keep same logic in TabLayoutNode and ReflexLayoutNode (vertical==true : v, vertical==false : >)
            orientation={currentLayout.vertical ? 'horizontal' : 'vertical'}
          >
            {rendered}
          </ReflexContainer>
        );
      }
    }
  };

  return (
    <>
      {/* {console.log('render')} */}
      <div className={flex}>{renderLayouts()}</div>
    </>
  );
}

export const DndLinearLayout = defaultContextManager<
  React.ComponentType<LinearLayoutProps>
>(MainLinearLayout);
