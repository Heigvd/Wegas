import * as React from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { Tab, dndAcceptType, DragTab, DropTab } from './DnDTabs';
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

export interface ComponentMap {
  [name: string]: React.ReactNode;
}

export const filterMap = (
  map: ComponentMap,
  filterFN: (k: string, i: number) => boolean,
) => {
  const newComponents: ComponentMap = {};
  Object.keys(map)
    .filter((k, i) => filterFN(k, i))
    .map(k => (newComponents[k] = map[k]));
  return newComponents;
};

export type DropAction = (item: { label: string; type: string }) => void;

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
      return { isOver: mon.isOver(), canDrop: mon.canDrop() };
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
  components: ComponentMap;
  /**
   * selectItems - the components that can be added in the tabLayout
   */
  selectItems?: ComponentMap;
  /**
   * activeId - the selected tab
   */
  defaultActiveLabel?: string;
  /**
   * onSelect - The function to call when a tab is selected
   */
  onSelect?: (label: string) => void;
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
  onDeleteTab: (label: string) => void;
  /**
   * onNewTab - The function to call when a new tab is requested
   */
  onNewTab: (label: string) => void;
}

/**
 * DnDTabLayout creates a tabLayout where you can drag and drop tabs
 */
export function DnDTabLayout({
  vertical,
  components,
  selectItems,
  defaultActiveLabel: activeLabel,
  onSelect,
  onDrop,
  onDropTab,
  onDeleteTab,
  onNewTab,
}: TabLayoutProps) {
  React.useEffect(() => {
    if (
      activeLabel === undefined ||
      (components[activeLabel] === undefined &&
        Object.keys(components).length > 0)
    ) {
      onSelect && onSelect(Object.keys(components)[0]);
    }
  }, [components, activeLabel, onSelect]);

  // DnD hooks (for dropping tabs on the side of the layout)
  const [dropLeftProps, dropLeft] = useDrop(dropSpecsFactory(onDrop('LEFT')));
  const [dropRightProps, dropRight] = useDrop(
    dropSpecsFactory(onDrop('RIGHT')),
  );
  const [dropTopProps, dropTop] = useDrop(dropSpecsFactory(onDrop('TOP')));
  const [dropBottomProps, dropBottom] = useDrop(
    dropSpecsFactory(onDrop('BOTTOM')),
  );
  const [dropTabsProps, dropTabs] = useDrop({
    accept: dndAcceptType,
    canDrop: () => false,
    collect: (mon: DropTargetMonitor) => {
      return {
        isOver: mon.isOver(),
      };
    },
  });

  /**
   * renderTabs generates a list with draggable and dropable tabs for the tabLayout
   */
  const renderTabs = () => {
    const tabs = [];
    const componentsKeys = Object.keys(components);
    for (let i = 0; i < componentsKeys.length; i += 1) {
      const label = componentsKeys[i];

      // Always put a dropTab on the left of a tab
      tabs.push(
        <DropTab
          key={label + 'LEFTDROP'}
          onDrop={onDropTab(i)}
          disabled={!dropTabsProps.isOver}
        />,
      );

      tabs.push(
        <DragTab
          key={label}
          label={label}
          active={label === activeLabel}
          onClick={() => {
            onSelect && onSelect(label);
          }}
        >
          <span className={grow}>
            {label}
            <IconButton
              icon="times"
              tooltip="Remove tab"
              onClick={() => onDeleteTab(label)}
              className={buttonStyle}
            />
          </span>
        </DragTab>,
      );

      // At the end, don't forget to add a dropTab on the right of the last tab
      if (Number(i) === componentsKeys.length - 1) {
        tabs.push(
          <DropTab
            key={label + 'RIGHTDROP'}
            onDrop={onDropTab(i + 1)}
            disabled={!dropTabsProps.isOver}
          />,
        );
      }
    }
    return tabs;
  };

  return (
    <Toolbar vertical={vertical}>
      <Toolbar.Header>
        <div ref={dropTabs} className={cx(flex, grow)}>
          {renderTabs()}
          {selectItems && Object.keys(selectItems).length > 0 && (
            <Tab key={'-1'}>
              <Menu
                items={Object.keys(selectItems).map(label => {
                  return { label: label, value: label };
                })}
                icon="plus"
                onSelect={i => {
                  onSelect && onSelect(i.value);
                  onNewTab(String(i.value));
                }}
                buttonClassName={buttonStyle}
                listClassName={listStyle}
              />
            </Tab>
          )}
        </div>
      </Toolbar.Header>
      <Toolbar.Content className={cx(flex, relative)}>
        {Object.keys(components).map(label => {
          return (
            <Reparentable
              key={label}
              id={label}
              innerClassName={cx(flex, grow)}
              outerClassName={cx(
                flex,
                grow,
                label !== activeLabel ? hidden : '',
              )}
            >
              {components[label]}
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
