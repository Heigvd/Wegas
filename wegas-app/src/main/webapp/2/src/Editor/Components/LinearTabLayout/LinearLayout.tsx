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

const flex = css({
  display: 'flex',
  flex: '1 1 auto',
});

// function getRandomColor() {
//   let letters = '0123456789ABCDEF';
//   let color = '#';
//   for (let i = 0; i < 6; i++) {
//     color += letters[Math.floor(Math.random() * 16)];
//   }
//   return color;
// }

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
    name: 'Page',
    component: <PageDisplay />,
  },
};

interface LayoutMap {
  [id: string]: LayoutNode;
}

const defaultLayoutMap: LayoutMap = {
  '0': {
    leaf: false,
    vertical: true,
    children: ['1', '2', '3'],
  },
  '1': {
    leaf: true,
    vertical: false,
    children: ['0'],
  },
  '2': {
    leaf: true,
    vertical: false,
    children: ['1', '2'],
  },
  '3': {
    leaf: false,
    vertical: false,
    children: ['4', '5'],
  },
  '4': {
    leaf: true,
    vertical: false,
    children: ['3'],
  },
  '5': {
    leaf: true,
    vertical: false,
    children: ['4'],
  },
};

interface LayoutNode {
  leaf: boolean; // If leaf is true, look in TabsMap
  vertical: boolean;
  children: string[];
}

interface Action {
  type: string;
}

interface ActionMove extends Action {
  type: 'MOVE';
  tabKey: string;
  layoutKey: string;
}

interface ActionDelete extends Action {
  type: 'DELETE';
  tabKey: string;
}

type TabLayoutsAction = ActionMove | ActionDelete;

const findLayoutKeyByTabId = (layouts: LayoutMap, tabKey: string) => {
  for (const layoutKey in layouts) {
    const layout = layouts[layoutKey];
    if (layout.leaf) {
      for (const tabIndex in layout.children) {
        if (layout.children[tabIndex] === tabKey) {
          return layoutKey;
        }
      }
    }
  }
  return null;
};

const deleteLayoutFromLayouts = (layouts: LayoutMap, layoutKey: string) => {
  let newLayout = omit(layouts, layoutKey);
  for (const key in newLayout) {
    if (!newLayout[key].leaf) {
      const layoutKeyIndex = newLayout[key].children.indexOf(layoutKey);
      if (layoutKeyIndex >= 0) {
        newLayout[key].children.splice(layoutKeyIndex, 1);
        if (newLayout[key].children.length === 0) {
          newLayout = deleteLayoutFromLayouts(newLayout, key);
        }
        return newLayout;
      }
    }
  }
  return newLayout;
};

interface LinearLayoutProps {
  tabMap?: TabsMap;
  layoutMap?: LayoutMap;
}

function MainLinearLayout(props: LinearLayoutProps) {
  const tabs = props.tabMap ? props.tabMap : defaultTabsMap;

  const setLayout = (layouts: LayoutMap, action: TabLayoutsAction) => {
    let newLayouts: LayoutMap = {};
    let cleanedLayout: LayoutMap = {};
    const oldLayoutKey = findLayoutKeyByTabId(layouts, action.tabKey);
    if (oldLayoutKey) {
      switch (action.type) {
        case 'MOVE': {
          newLayouts[oldLayoutKey] = {
            ...layouts[oldLayoutKey],
            children: layouts[oldLayoutKey].children.filter(
              el => el !== action.tabKey,
            ),
          };
          newLayouts[action.layoutKey] = {
            ...layouts[action.layoutKey],
            children: [
              // Avoid pasting 2 times the same element
              ...(oldLayoutKey === action.layoutKey ? newLayouts : layouts)[
                action.layoutKey
              ].children,
              action.tabKey,
            ],
          };

          break;
        }
        case 'DELETE': {
          break;
        }
      }

      cleanedLayout = {
        ...layouts,
        ...newLayouts,
      };

      //Verifies that the old tabView still have tabs. If not, delete it.
      if (newLayouts[oldLayoutKey].children.length === 0) {
        cleanedLayout = deleteLayoutFromLayouts(cleanedLayout, oldLayoutKey);
      }
    }

    console.log('cleanedLayout', cleanedLayout);

    return cleanedLayout;
  };

  const [layout, dispatchLayout] = React.useReducer(
    setLayout,
    props.layoutMap ? props.layoutMap : defaultLayoutMap,
  );

  const onDropTab = (layoutKey: string) => (item: {
    id: number;
    type: string;
  }) => {
    dispatchLayout({
      type: 'MOVE',
      layoutKey: layoutKey,
      tabKey: String(item.id),
    });
  };

  const onDropLeft = (layoutKey: string) => (item: {
    id: number;
    type: string;
  }) => {
    console.log('onDropLeft : ' + layoutKey, item);
  };

  const onDropRight = (layoutKey: string) => (item: {
    id: number;
    type: string;
  }) => {
    console.log('onDropRight : ' + layoutKey, item);
  };

  const onDropTop = (layoutKey: string) => (item: {
    id: number;
    type: string;
  }) => {
    console.log('onDropTop : ' + layoutKey, item);
  };

  const onDropBottom = (layoutKey: string) => (item: {
    id: number;
    type: string;
  }) => {
    console.log('onDropBottom : ' + layoutKey, item);
  };

  const renderLayouts = (layoutKey: string = '0') => {
    const currentLayout = layout[layoutKey];
    if (currentLayout.leaf) {
      return (
        <DnDTabLayout
          tabs={currentLayout.children.map(key => {
            return {
              id: Number(key),
              ...tabs[key],
            };
          })}
          onDropTab={onDropTab(layoutKey)}
          onDropLeft={onDropLeft(layoutKey)}
          onDropRight={onDropRight(layoutKey)}
          onDropTop={onDropTop(layoutKey)}
          onDropBottom={onDropBottom(layoutKey)}
          vertical={currentLayout.vertical}
        />
      );
    } else {
      let rendered: JSX.Element[] = [];
      for (let i = 0; i < currentLayout.children.length; i += 1) {
        rendered.push(
          <ReflexElement key={currentLayout.children[i]}>
            {renderLayouts(currentLayout.children[i])}
          </ReflexElement>,
        );
        if (i < currentLayout.children.length - 1) {
          rendered.push(<ReflexSplitter />);
        }
      }

      return (
        <ReflexContainer
          orientation={currentLayout.vertical ? 'vertical' : 'horizontal'}
        >
          {rendered}
        </ReflexContainer>
      );
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
