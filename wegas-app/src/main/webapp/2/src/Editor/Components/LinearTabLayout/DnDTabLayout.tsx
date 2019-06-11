import * as React from 'react';
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
import { themeVar } from '../../../Components/Theme';
import { DropActionType } from './LinearLayout';

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

const dropZoneFocus = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.successColor,
  zIndex: 1000,
});

const dropLeftZone = css({
  position: 'absolute',
  width: '20%',
  height: '100%',
  left: 0,
});

const dropRightZone = css({
  position: 'absolute',
  width: '20%',
  height: '100%',
  right: 0,
});

const dropTopZone = css({
  position: 'absolute',
  width: '100%',
  height: '20%',
  top: 0,
});

const dropBottomZone = css({
  position: 'absolute',
  width: '100%',
  height: '20%',
  bottom: 0,
});

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
});
const relative = css({
  position: 'relative',
});

export interface TabComponent {
  id: number;
  name: string;
  component: JSX.Element;
}

export type DropAction = (item: { id: number; type: string }) => void;

/**
 * dropSpecsFactory creates an object for react-dnd drop hooks management
 *
 * @param action - the action to do when an element is dropped
 *
 */
export const dropSpecsFactory = (action: DropAction) => {
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

interface TabLayoutProps {
  /**
   * vertical - the orientation of the tab layout
   */
  vertical?: boolean;
  /**
   * components - the components to be displayed in the tabLayout
   */
  components: TabComponent[];
  /**
   * selectItems - the components that can be added in the tabLayout
   */
  selectItems?: TabComponent[];
  /**
   * activeId - the selected tab
   */
  defaultActiveId?: number;
  /**
   * onDrop - The function to call when a drop occures on the side
   */
  onDrop: (type: DropActionType) => DropAction;
  /**
   * onDropTab - The function to call when a drop occures on the dropTabs
   */
  onDropTab: (index: number) => DropAction;
  /**
   * onDeleteTab - The function to call when a tab is deleted
   */
  onDeleteTab: (tabKey: string) => void;
  /**
   * onNewTab - The function to call when a new tab is requested
   */
  onNewTab: (tabKey: string) => void;
}

/**
 * DnDTabLayout creates a tabLayout where you can drag and drop tabs
 */
export function DnDTabLayout({
  vertical,
  components,
  selectItems,
  defaultActiveId,
  onDrop,
  onDropTab,
  onDeleteTab,
  onNewTab,
}: TabLayoutProps) {
  const [activeKey, setActiveKey] = React.useState(
    defaultActiveId !== undefined ? defaultActiveId : -1,
  );
  const prevComponents = React.useRef<TabComponent[]>([]);

  const onDrag = (tabId: number) => {
    prevComponents.current = prevComponents.current.filter(c => c.id !== tabId);
  };

  React.useEffect(() => {
    const newComponents = components.filter(
      c => prevComponents.current.find(pc => pc.id === c.id) === undefined,
    );

    if (newComponents.length > 0) {
      setActiveKey(components.find(c => c === newComponents[0])!.id);
    } else if (components.find(c => c.id === activeKey) === undefined) {
      if (components.length > 0) {
        setActiveKey(components[0].id);
      }
    }
    prevComponents.current = components;
    // We dont want to refresh everytime activeKey changes (infinite loop)
  }, [components]); // eslint-disable-line react-hooks/exhaustive-deps

  // DnD hooks (for dropping tabs on the side of the layout)
  const [dropLeftProps, dropLeft] = dnd.useDrop(
    dropSpecsFactory(onDrop('LEFT')),
  );
  const [dropRightProps, dropRight] = dnd.useDrop(
    dropSpecsFactory(onDrop('RIGHT')),
  );
  const [dropTopProps, dropTop] = dnd.useDrop(dropSpecsFactory(onDrop('TOP')));
  const [dropBottomProps, dropBottom] = dnd.useDrop(
    dropSpecsFactory(onDrop('BOTTOM')),
  );

  /**
   * renderTabs generates a list with draggable and dropable tabs for the tabLayout
   */
  const renderTabs = React.useCallback(() => {
    const tabs = [];

    for (let i = 0; i < components.length; i += 1) {
      const t = components[i];
      const isActive =
        activeKey !== undefined ? t.id === activeKey : Number(i) === 0;

      // Always put a dropTab on the left of a tab
      tabs.push(
        <DnDropTab key={String(t.id) + 'LEFTDROP'} onDrop={onDropTab(i)} />,
      );

      tabs.push(
        <Tab
          key={t.id}
          id={t.id}
          active={isActive}
          onClick={() => setActiveKey(t.id)}
          onDrag={onDrag}
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

      // At the end, don't forget to add a dropTab on the right of the last tab
      if (Number(i) === components.length - 1) {
        tabs.push(
          <DnDropTab
            key={String(t.id) + 'RIGHTDROP'}
            onDrop={onDropTab(i + 1)}
          />,
        );
      }
    }
    return tabs;
  }, [components, activeKey, onDeleteTab, onDropTab]);

  return (
    <Toolbar vertical={vertical}>
      <Toolbar.Header>
        {renderTabs()}
        {selectItems && selectItems.length > 0 && (
          <Tab key={'-1'} id={-1} active={false}>
            <Menu
              items={selectItems.map(e => {
                return { label: e.name, value: e.id };
              })}
              icon="plus"
              onSelect={i => {
                setActiveKey(i.value);
                onNewTab(String(i.value));
              }}
              buttonClassName={buttonStyle}
              listClassName={listStyle}
            />
          </Tab>
        )}
      </Toolbar.Header>
      <Toolbar.Content className={cx(flex, relative)}>
        {components.map(t => {
          return (
            <Reparentable
              key={t.id}
              id={String(t.id)}
              innerClassName={cx(flex, grow)}
              outerClassName={cx(flex, grow, t.id !== activeKey ? hidden : '')}
            >
              {t.component}
            </Reparentable>
          );
        })}
        {dropLeftProps.canDrop && (
          <div
            ref={dropLeft}
            className={cx(dropLeftZone, dropLeftProps.isOver && dropZoneFocus)}
          />
        )}
        {dropRightProps.canDrop && (
          <div
            ref={dropRight}
            className={cx(
              dropRightZone,
              dropRightProps.isOver && dropZoneFocus,
            )}
          />
        )}
        {dropTopProps.canDrop && (
          <div
            ref={dropTop}
            className={cx(dropTopZone, dropTopProps.isOver && dropZoneFocus)}
          />
        )}
        {dropBottomProps.canDrop && (
          <div
            ref={dropBottom}
            className={cx(
              dropBottomZone,
              dropBottomProps.isOver && dropZoneFocus,
            )}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
