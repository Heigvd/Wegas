import * as React from 'react';
import { DropType } from './LinearLayout';
import {
  __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd,
  DropTargetMonitor,
} from 'react-dnd';
import { DnDropTab, Tab, dndAcceptType } from './DnDTabs';
import { IconButton } from '../../../Components/Button/IconButton';
import { Toolbar } from '../../../Components/Toolbar';
import { Menu } from '../../../Components/Menu';
import { Reparentable } from '../Reparentable';
import { cx, css } from 'emotion';
import u from 'immer';
import { themeVar } from '../../../Components/Theme';

const hidden = css({
  display: 'none',
});

const buttonStyle = css({
  color: themeVar.primaryDarkerTextColor,
  ':hover': {
    color: 'lightgrey',
  },
});

const listStyle = css({
  color: themeVar.primaryDarkerTextColor,
  backgroundColor: themeVar.primaryDarkerColor,
});

const compoContent = css({
  position: 'relative',
  height: 'auto',
  display: 'flex',
});

const dropZoneStyle = {
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: 'red',
};

const dropVerticalZone = css({
  ...dropZoneStyle,
  top: 0,
  height: '100%',
});

const dropHorizontalZone = css({
  ...dropZoneStyle,
  left: 0,
  width: '100%',
});

const dropLeftZone = css({
  position: 'absolute',
  width: '20%',
  height: '60%',
  left: 0,
  top: '20%',
});

const dropRightZone = css({
  position: 'absolute',
  width: '20%',
  height: '60%',
  right: 0,
  top: '20%',
});

const dropTopZone = css({
  position: 'absolute',
  width: '60%',
  height: '20%',
  top: 0,
  left: '20%',
});

const dropBottomZone = css({
  position: 'absolute',
  width: '60%',
  height: '20%',
  bottom: 0,
  left: '20%',
});

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
});

export interface TabComponent {
  id: number;
  name: string;
  component: JSX.Element;
}

export type DropAction = (item: { id: number; type: string }) => void;

interface TabLayoutProps {
  vertical?: boolean;
  components: TabComponent[];
  selectItems?: { label: string; value: number }[];
  allowDrop: boolean;
  activeId?: number;
  onDrop: (type: DropType) => DropAction;
  onDropTab: (index: number) => DropAction;
  onDeleteTab: (tabKey: string) => void;
  onDrag: (isDragging: boolean, tabKey: string) => void;
  onNewTab: (tabKey: string) => void;
}

export const dropSpecs = (action: DropAction) => {
  return {
    accept: dndAcceptType,
    canDrop: () => true,
    drop: action,
    collect: (mon: DropTargetMonitor) => {
      let isOver: boolean;
      let canDrop: boolean;
      try {
        isOver = mon.isOver();
        canDrop = mon.canDrop();
      } catch {
        isOver = false;
        canDrop = false;
      }
      return { isOver, canDrop };
    },
  };
};

interface TabState {
  activeId?: number;
  tabs: TabComponent[];
}

interface Action {
  type: string;
}

interface NewTabsAction extends Action {
  type: 'NEWTABS';
  tabs: TabComponent[];
  activeId?: number;
}

interface KeyAction extends Action {
  type: 'NEWKEY' | 'REMOVEDKEY';
  id: number;
}

type StateAction = NewTabsAction | KeyAction;

const setTabState = (tabState: TabState, action: StateAction) =>
  u(tabState, (tabState: TabState) => {
    switch (action.type) {
      case 'NEWTABS': {
        if (action.tabs.length === 0) {
          tabState.activeId = undefined;
        } else if (action.activeId !== undefined) {
          tabState.activeId = action.activeId;
        } else {
          const newTabIds = action.tabs.map(c => c.id);
          const oldTabIds = tabState.tabs.map(c => c.id);
          const areTabsDifferent = String(newTabIds) !== String(oldTabIds);

          if (areTabsDifferent) {
            if (newTabIds.length < oldTabIds.length) {
              if (
                tabState.activeId &&
                newTabIds.indexOf(tabState.activeId) < 0
              ) {
                tabState.activeId = newTabIds[newTabIds.length - 1];
              }
            } else {
              const diffTabIds = newTabIds.filter(
                key => oldTabIds.indexOf(key) < 0,
              );
              tabState.activeId = action.activeId;
              if (diffTabIds.length > 0) {
                if (action.activeId === undefined) {
                  tabState.activeId = diffTabIds[0];
                }
              }
            }
          }
        }
        tabState.tabs = action.tabs;
        break;
      }
      case 'NEWKEY': {
        tabState.activeId = action.id;
        break;
      }
      case 'REMOVEDKEY': {
        if (action.id === tabState.activeId) {
          const newTabs = tabState.tabs.filter(c => c.id !== action.id);
          const lastTab = newTabs.pop();
          const newId = lastTab ? lastTab.id : undefined;
          tabState.activeId = newId;
        }
        break;
      }
    }
    return tabState;
  });

export function DnDTabLayout({
  vertical,
  components,
  selectItems,
  allowDrop,
  activeId,
  onDrop,
  onDropTab,
  onDeleteTab,
  onDrag,
  onNewTab,
}: TabLayoutProps) {
  const [tabState, dispatchTabState] = React.useReducer(setTabState, {
    tabs: [],
    activeId: activeId,
  });

  React.useEffect(() => {
    dispatchTabState({
      type: 'NEWTABS',
      tabs: components,
      activeId: activeId,
    });
  }, [components, activeId]);

  const [dropLeftProps, dropLeft] = dnd.useDrop(dropSpecs(onDrop('LEFT')));
  const [dropRightProps, dropRight] = dnd.useDrop(dropSpecs(onDrop('RIGHT')));
  const [dropTopProps, dropTop] = dnd.useDrop(dropSpecs(onDrop('TOP')));
  const [dropBottomProps, dropBottom] = dnd.useDrop(
    dropSpecs(onDrop('BOTTOM')),
  );

  const onDragTab = React.useCallback(
    (isDragging: boolean, tabId: number) => {
      if (isDragging) {
        dispatchTabState({
          type: 'REMOVEDKEY',
          id: tabId,
        });
      }
      onDrag(isDragging, String(tabId));
    },
    [onDrag],
  );

  const renderTabs = React.useCallback(() => {
    const tabs = [];

    for (let i = 0; i < tabState.tabs.length; i += 1) {
      const t = tabState.tabs[i];
      const isActive =
        tabState.activeId !== undefined
          ? t.id === tabState.activeId
          : Number(i) === 0;

      tabs.push(
        <DnDropTab key={String(t.id) + 'LEFTDROP'} onDrop={onDropTab(i)} />,
      );

      tabs.push(
        <Tab
          key={t.id}
          id={t.id}
          active={isActive}
          onClick={() =>
            dispatchTabState({
              type: 'NEWKEY',
              id: t.id,
            })
          }
          onDrag={onDragTab}
        >
          <span className={grow}>
            {t.name}
            <IconButton
              icon="times"
              tooltip="Remove tab"
              onClick={() => onDeleteTab(String(t.id))}
              className={buttonStyle}
            />
          </span>
        </Tab>,
      );

      if (Number(i) === tabState.tabs.length - 1) {
        tabs.push(
          <DnDropTab
            key={String(t.id) + 'RIGHTDROP'}
            onDrop={onDropTab(i + 1)}
          />,
        );
      }
    }
    return tabs;
  }, [onDeleteTab, onDragTab, onDropTab, tabState.activeId, tabState.tabs]);

  return (
    <Toolbar vertical={vertical}>
      <Toolbar.Header>
        {renderTabs()}
        {selectItems && selectItems.length > 0 && (
          <Tab key={'-1'} id={-1} active={false}>
            <Menu
              items={selectItems}
              icon="plus"
              onSelect={i => onNewTab(String(i.value))}
              buttonClassName={buttonStyle}
              listClassName={listStyle}
            />
          </Tab>
        )}
      </Toolbar.Header>
      <Toolbar.Content className={compoContent}>
        {tabState.tabs.map(t => {
          return (
            <Reparentable
              key={t.id}
              id={String(t.id)}
              innerClassName={cx(flex, grow)}
              outerClassName={cx(
                flex,
                grow,
                t.id !== tabState.activeId ? hidden : '',
              )}
            >
              {t.component}
            </Reparentable>
          );
        })}
        {allowDrop && (
          <>
            <div
              ref={dropLeft}
              className={cx(
                dropLeftZone,
                dropLeftProps.isOver &&
                  dropLeftProps.canDrop &&
                  dropVerticalZone,
              )}
            />
            <div
              ref={dropRight}
              className={cx(
                dropRightZone,
                dropRightProps.isOver &&
                  dropRightProps.canDrop &&
                  dropVerticalZone,
              )}
            />
            <div
              ref={dropTop}
              className={cx(
                dropTopZone,
                dropTopProps.isOver &&
                  dropTopProps.canDrop &&
                  dropHorizontalZone,
              )}
            />
            <div
              ref={dropBottom}
              className={cx(
                dropBottomZone,
                dropBottomProps.isOver &&
                  dropBottomProps.canDrop &&
                  dropHorizontalZone,
              )}
            />
          </>
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

// export const MyTabLayout = React.memo(DnDTabLayout, (prev, next) => {
//   Object.keys(prev).forEach(key => {
//     if (prev[key] !== next[key]) {
//       console.log(key, prev[key], next[key]);
//     }
//   });
//   return false;
// });
