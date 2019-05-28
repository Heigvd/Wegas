import * as React from 'react';
import { css, cx } from 'emotion';
import {
  __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd,
  DropTargetMonitor,
} from 'react-dnd';
import { Toolbar } from '../../../Components/Toolbar';
import { primaryLight, primaryDark, themeVar } from '../../../Components/Theme';
import { IconButton } from '../../../Components/Button/IconButton';
import { Menu } from '../../../Components/Menu';
import { DropType } from './LinearLayout';
import u from 'immer';
import { Reparentable } from '../Reparentable';

const buttonStyle = css({
  color: themeVar.primaryDarkerTextColor,
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

const dropZone = css({
  ...dropZoneStyle,
});

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
  // alignItems: 'center',
});

export interface TabComponent {
  id: number;
  name: string;
  component: JSX.Element;
}

type DropAction = (item: { id: number; type: string }) => void;

interface TabLayoutProps {
  vertical?: boolean;
  components: TabComponent[];
  selectItems?: { label: string; value: number }[];
  allowDrop: boolean;
  onDrop: (type: DropType) => DropAction;
  onDeleteTab: (tabKey: string) => void;
  onDrag: (isDragging: boolean, tabKey: string) => void;
  onNewTab: (tabKey: string) => void;
}

const accept = 'DnDTab';

const dropSpecs = (action: DropAction) => {
  return {
    accept: accept,
    canDrop: () => true,
    drop: action,
    collect: (mon: DropTargetMonitor) => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
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
  onDrop,
  onDeleteTab,
  onDrag,
  onNewTab,
}: TabLayoutProps) {
  const [tabState, dispatchTabState] = React.useReducer(setTabState, {
    tabs: [],
  });

  React.useEffect(() => {
    dispatchTabState({
      type: 'NEWTABS',
      tabs: components,
    });
  }, [components]);

  const [dropTabProps, dropTab] = dnd.useDrop(dropSpecs(onDrop('TAB')));
  const [dropLeftProps, dropLeft] = dnd.useDrop(dropSpecs(onDrop('LEFT')));
  const [dropRightProps, dropRight] = dnd.useDrop(dropSpecs(onDrop('RIGHT')));
  const [dropTopProps, dropTop] = dnd.useDrop(dropSpecs(onDrop('TOP')));
  const [dropBottomProps, dropBottom] = dnd.useDrop(
    dropSpecs(onDrop('BOTTOM')),
  );

  const onTabDrag = (isDragging: boolean, tabId: number) => {
    if (isDragging) {
      dispatchTabState({
        type: 'REMOVEDKEY',
        id: tabId,
      });
    }
    onDrag(isDragging, String(tabId));
  };

  return (
    <Toolbar vertical={vertical}>
      <div
        ref={dropTab}
        className={cx(
          allowDrop && dropTabProps.isOver && dropTabProps.canDrop && dropZone,
        )}
      >
        <Toolbar.Header>
          {tabState.tabs.map((t, i) => {
            const isActive =
              tabState.activeId !== undefined
                ? t.id === tabState.activeId
                : i === 0;
            return (
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
                onDrag={onTabDrag}
              >
                <div className={flex}>
                  <span className={grow}> {t.name}</span>
                  <IconButton
                    icon="times"
                    tooltip="Remove tab"
                    onClick={() => onDeleteTab(String(t.id))}
                    className={buttonStyle}
                  />
                </div>
              </Tab>
            );
          })}
          {selectItems && selectItems.length > 0 && (
            <Tab
              key={'-1'}
              id={-1}
              active={false}
              tabColors={{ active: '', inactive: css(dropZoneStyle) }}
            >
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
      </div>
      <Toolbar.Content className={compoContent}>
        {tabState.tabs.map(t => {
          return (
            // <div
            //   key={t.id}
            //   style={t.id !== tabState.activeId ? { display: 'none' } : {}}
            //   className={grow}
            // >
            <Reparentable
              id={String(t.id)}
              className={cx(flex, grow)}
              key={t.id}
              style={
                t.id !== tabState.activeId
                  ? { display: 'none' }
                  : { backgroundColor: 'green' }
              }
            >
              {t.component}
            </Reparentable>
            // </div>
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

const defaultTabStyle = css({
  display: 'inline-block',
  cursor: 'pointer',
  margin: '0 0.2em',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 1px',
  padding: '5px',
});

interface TabProps {
  active: boolean;
  id: number;
  children: React.ReactChild | null;
  onClick?: () => void;
  onDrag?: (isDragging: boolean, tabId: number) => void;
  tabColors?: { active: string; inactive: string };
}

function Tab(props: TabProps) {
  const [, drag] = dnd.useDrag({
    item: { id: props.id, type: accept },
    canDrag: props.onDrag !== undefined,
    begin: () => props.onDrag && props.onDrag(true, props.id),
    end: () => props.onDrag && props.onDrag(false, props.id),
  });

  const activeTabStyle = css(
    props.tabColors ? props.tabColors.active : primaryDark,
    defaultTabStyle,
  );
  const inactiveTabStyle = css(
    props.tabColors ? props.tabColors.inactive : primaryLight,
    defaultTabStyle,
  );

  if (props.children === null) {
    return null;
  }
  return (
    <div
      ref={drag}
      className={`${props.active ? activeTabStyle : inactiveTabStyle}`}
      onClick={() => {
        if (props.onClick) {
          props.onClick();
        }
      }}
    >
      {props.children}
    </div>
  );
}
