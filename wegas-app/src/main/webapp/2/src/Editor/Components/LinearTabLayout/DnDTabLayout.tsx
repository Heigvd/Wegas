import * as React from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { Tab, DragTab, DropTab, TabComponent } from './DnDTabs';
import { Toolbar } from '../../../Components/Toolbar';
import { DropMenu } from '../../../Components/DropMenu';
import { Reparentable } from '../Reparentable';
import { cx, css } from 'emotion';
import { DropActionType } from './LinearLayout';
import {
  grow,
  flex,
  relative,
  absoute,
  expandBoth,
  hidden,
  hideOverflow,
  autoScroll,
  headerStyle,
  hatchedBackground,
  childrenHeaderStyle,
} from '../../../css/classes';
import { childrenPlusTabStyle, plusTabStyle } from '../../../Components/Tabs';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import { internalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';

const dropZoneFocus = hatchedBackground;

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

const dropTabZone = css({ width: '50px' });

export interface ComponentMap {
  [name: string]: React.ReactNode;
}

export const filterMap = (
  map: ComponentMap,
  filterFN: (k: string, i: number) => boolean,
) =>
  Object.keys(map)
    .filter((k, i) => filterFN(k, i))
    .reduce<ComponentMap>(
      (newComponents, k) => ({ ...newComponents, [k]: map[k] }),
      {},
    );

export type DropAction = (item: { label: string; type: string }) => void;

/**
 * dropSpecsFactory creates an object for react-dnd drop hooks management
 *
 * @param action - the action to do when an element is dropped
 *
 */
export const dropSpecsFactory = (action: DropAction, layoutAccept: string) => {
  return {
    accept: layoutAccept,
    canDrop: () => true,
    drop: action,
    collect: (mon: DropTargetMonitor) => ({
      isOver: mon.isOver(),
      canDrop: mon.canDrop(),
    }),
  };
};
export interface ClassNames {
  general?: string;
  header?: string;
  content?: string;
}

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
   * defaultActiveLabel - the selected tab at startup
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
  /**
   * layoutId - The token that filter the drop actions
   */
  layoutId: string;
  /**
   * The tab component to use in this layout
   */
  CustomTab?: TabComponent;
  /**
   * The className for general styling
   */
  classNames?: ClassNames
  /**
   * If tabs are children of other tabs (styling purpose mainly).
   */
   areChildren?: boolean;
}

/**
 * DnDTabLayout creates a tabLayout where you can drag and drop tabs
 */
export function DnDTabLayout({
  vertical,
  components,
  selectItems,
  defaultActiveLabel,
  onSelect,
  onDrop,
  onDropTab,
  onDeleteTab,
  onNewTab,
  layoutId,
  CustomTab = Tab,
  classNames = {},
  areChildren,
}: TabLayoutProps) {
  const { general, header, content } = classNames;
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(commonTranslations, lang);
  React.useEffect(() => {
    if (
      defaultActiveLabel === undefined ||
      (components[defaultActiveLabel] === undefined &&
        Object.keys(components).length > 0)
    ) {
      onSelect && onSelect(Object.keys(components)[0]);
    }
  }, [components, defaultActiveLabel, onSelect]);

  // DnD hooks (for dropping tabs on the side of the layout)
  const [dropLeftProps, dropLeft] = useDrop(
    dropSpecsFactory(onDrop('LEFT'), layoutId),
  );
  const [dropRightProps, dropRight] = useDrop(
    dropSpecsFactory(onDrop('RIGHT'), layoutId),
  );
  const [dropTopProps, dropTop] = useDrop(
    dropSpecsFactory(onDrop('TOP'), layoutId),
  );
  const [dropBottomProps, dropBottom] = useDrop(
    dropSpecsFactory(onDrop('BOTTOM'), layoutId),
  );
  const [dropTabsProps, dropTabs] = useDrop({
    accept: layoutId,
    canDrop: () => true,
    collect: (mon: DropTargetMonitor) => ({
      isOver: mon.isOver(),
      isShallowOver: mon.isOver({ shallow: true }),
    }),
    drop: onDropTab(Object.keys(components).length),
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
          overview={{
            position: 'left',
            overviewNode: <div className={dropTabZone}></div>,
          }}
          layoutId={layoutId}
          CustomTab={CustomTab}
        >
          <DragTab
            key={label}
            label={label}
            active={label === defaultActiveLabel}
            onClick={() => {
              onSelect && onSelect(label);
            }}
            layoutId={layoutId}
            CustomTab={CustomTab}
            isChild={areChildren}
          >
            {label}
            <IconButton
              icon="times"
              tooltip="Remove tab"
              onClick={() => onDeleteTab(label)}
            />
          </DragTab>
        </DropTab>,
      );

      // At the end, don't forget to add a dropTab on the right of the last tab
      if (Number(i) === componentsKeys.length - 1) {
        tabs.push(
          <CustomTab
            key={label + 'RIGHTDROP'}
            className={
              dropTabsProps.isShallowOver
                ? cx(dropTabZone, dropZoneFocus)
                : hidden
            }
          />,
        );
      }
    }
    return tabs;
  };

  return (
    <Toolbar vertical={vertical} className={cx(relative, general, css({backgroundColor: themeVar.colors.BackgroundColor}))}>
      <Toolbar.Header className={cx(header, {
        [childrenHeaderStyle]: areChildren !== undefined && areChildren,
        [headerStyle]: !areChildren
      })}>
        <div ref={dropTabs} className={cx(flex, grow, autoScroll)}>
          {renderTabs()}
          {selectItems && Object.keys(selectItems).length > 0 && (
            <CustomTab key={'-1'} className={cx({
              [childrenPlusTabStyle]: areChildren !== undefined && areChildren,
              [plusTabStyle]: !areChildren
            })}>
              <DropMenu
                items={Object.keys(selectItems).map(label => ({
                  label: label,
                  value: label,
                }))}
                icon="plus"
                onSelect={i => {
                  onSelect && onSelect(i.value);
                  onNewTab(String(i.value));
                }}
              />
            </CustomTab>
          )}
        </div>
      </Toolbar.Header>
      <Toolbar.Content className={cx(relative, content)}>
        <div className={cx(expandBoth, hideOverflow)}>
          <div className={cx(autoScroll, absoute, expandBoth, flex)}>
            {defaultActiveLabel && components[defaultActiveLabel] && (
              <Reparentable
                id={defaultActiveLabel}
                innerClassName={cx(flex, expandBoth)}
                outerClassName={expandBoth}
              >
                <React.Suspense fallback={<div>{i18nValues.loading}...</div>}>
                  {components[defaultActiveLabel]}
                </React.Suspense>
              </Reparentable>
            )}
          </div>
          {(dropLeftProps.canDrop ||
            dropRightProps.canDrop ||
            dropTopProps.canDrop ||
            dropBottomProps.canDrop) && (
            <div className={cx(absoute, expandBoth)}>
              <div
                ref={dropLeft}
                className={cx(
                  dropLeftZone,
                  dropLeftProps.isOver && dropZoneFocus,
                )}
              />
              <div
                ref={dropRight}
                className={cx(
                  dropRightZone,
                  dropRightProps.isOver && dropZoneFocus,
                )}
              />
              <div
                ref={dropTop}
                className={cx(
                  dropTopZone,
                  dropTopProps.isOver && dropZoneFocus,
                )}
              />
              <div
                ref={dropBottom}
                className={cx(
                  dropBottomZone,
                  dropBottomProps.isOver && dropZoneFocus,
                )}
              />
            </div>
          )}
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
