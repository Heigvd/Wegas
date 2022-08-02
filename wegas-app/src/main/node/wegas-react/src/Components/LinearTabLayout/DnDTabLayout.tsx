import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import {
  absolute,
  autoScroll,
  expandBoth,
  expandWidth,
  flex,
  grow,
  hatchedBackground,
  headerStyle,
  hideOverflow,
  relative,
} from '../../css/classes';
import { EditorTabsTranslations } from '../../i18n/editorTabs/definitions';
import { editorTabsTranslations } from '../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { DropMenu } from '../DropMenu';
import { IconButton } from '../Inputs/Buttons/IconButton';
import { Tab } from '../TabLayout/Tab';
import {
  ClassNames,
  StatelessTabLayoutProps,
  TabLayoutContentWithFullScreen,
} from '../TabLayout/TabLayout';
import { plusTabStyle, tabsStyle } from '../TabLayout/tabLayoutStyles';
import { themeVar } from '../Theme/ThemeVars';
import { Toolbar } from '../Toolbar';
import { DragTab, DropTab } from './DnDTabs';
import { DropActionType } from './LinearLayout';

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

const headerTabStyle = css({
  paddingTop: '20px',
  columnGap: '5px',
});

export type DropAction = (item: { label: string; type: string }) => void;

/**
 * dropSpecsFactory creates an object for react-dnd drop hooks management
 *
 * @param action - the action to do when an element is dropped
 *
 */
const dropSpecsFactory = (action: DropAction, dndAcceptType: string) => {
  return {
    accept: dndAcceptType,
    canDrop: () => true,
    drop: action,
    collect: (mon: DropTargetMonitor) => {
      return {
        isOver: mon.isOver(),
        canDrop: mon.canDrop(),
      };
    },
  };
};

function translateTabs(
  dndTabs: DnDTabs,
  i18nTabsNames: EditorTabsTranslations,
): DnDTabs {
  return dndTabs.map(dndTab => {
    const translatedOrUndefLabel =
      i18nTabsNames.tabsNames[
        dndTab.label as keyof EditorTabsTranslations['tabsNames']
      ];
    const translatedLabel = translatedOrUndefLabel
      ? translatedOrUndefLabel
      : dndTab.label;
    const translatedItems = dndTab.items
      ? translateTabs(dndTab.items, i18nTabsNames)
      : undefined;
    return { ...dndTab, label: translatedLabel, items: translatedItems };
  });
}

function flatFindUsableTabs(tabs: DnDTabs): DnDTabs {
  return tabs
    .flatMap(tab => {
      if (tab.items == null) {
        return tab;
      } else {
        return flatFindUsableTabs(tab.items);
      }
    })
    .filter(function (
      tab: DropMenuItem<string> | undefined,
    ): tab is DropMenuItem<string> {
      return tab != null;
    });
}

interface DnDTabLayoutHeaderProps
  extends Pick<
      DnDTabLayoutProps,
      | 'components'
      | 'otherTabs'
      | 'dndAcceptType'
      | 'activeTab'
      | 'onDropTab'
      | 'onSelect'
      | 'onNewTab'
      | 'onDeleteTab'
      | 'CustomTab'
    >,
    Pick<DnDClassNames, 'tabsClassName' | 'plusTabClassName'> {
  onFullScreen: () => void;
}

function DnDTabLayoutHeader({
  components,
  otherTabs,
  dndAcceptType,
  activeTab,
  onDropTab,
  onSelect,
  onNewTab,
  onDeleteTab,
  onFullScreen,
  CustomTab = Tab,
  tabsClassName,
  plusTabClassName,
}: DnDTabLayoutHeaderProps) {
  const i18nTabsNames = useInternalTranslate(editorTabsTranslations);
  const tabsClassNameFn = tabsClassName ? tabsClassName : tabsStyle;

  const showAddTab =
    otherTabs != null && flatFindUsableTabs(otherTabs).length > 0;

  return (
    <div className={cx(flex, grow, autoScroll, headerTabStyle)}>
      <DropTab
        dndAcceptType={dndAcceptType}
        position={'FIRST'}
        onDrop={onDropTab(0)}
      />
      {components.map(({ tabId: label }, i, array) => {
        const translatedOrUndefLabel =
          i18nTabsNames.tabsNames[
            label as keyof EditorTabsTranslations['tabsNames']
          ];
        const translatedLabel = translatedOrUndefLabel
          ? translatedOrUndefLabel
          : label;

        return (
          <React.Fragment key={`DnDTab-${label}#${i}`}>
            {i > 0 && (
              <DropTab
                dndAcceptType={dndAcceptType}
                position={'MIDDLE'}
                onDrop={onDropTab(i)}
              />
            )}{' '}
            <DragTab
              key={label}
              label={label}
              className={tabsClassNameFn(activeTab === label)}
              onClick={() => {
                onSelect && onSelect(label);
              }}
              onDoubleClick={onFullScreen}
              dndAcceptType={dndAcceptType}
              CustomTab={CustomTab}
            >
              <span className="tab-label">{translatedLabel}</span>
              <IconButton
                icon="times"
                tooltip="Remove tab"
                onClick={() => onDeleteTab(label)}
                className={'close-btn'}
              />
            </DragTab>
            {i === array.length - 1 && (
              <DropTab
                dndAcceptType={dndAcceptType}
                position={'LAST'}
                onDrop={onDropTab(i + 1)}
              />
            )}
          </React.Fragment>
        );
      })}
      {showAddTab && (
        <CustomTab
          className={plusTabClassName ? plusTabClassName : plusTabStyle}
        >
          <DropMenu
            items={translateTabs(otherTabs, i18nTabsNames)}
            icon="plus"
            onSelect={i => {
              onSelect && onSelect(i.value);
              onNewTab(String(i.value));
            }}
          />
        </CustomTab>
      )}
      {!showAddTab && components.length === 0 && (
        <h3>{i18nTabsNames.miscellaneous.noAvailableTabs}</h3>
      )}
    </div>
  );
}

export type DnDTabs = DropMenuItem<string>[];

export interface DnDClassNames extends ClassNames {
  plusTabClassName?: string;
}

interface DnDTabLayoutProps extends StatelessTabLayoutProps {
  /**
   * selectItems - the components that can be added in the tabLayout
   */
  otherTabs?: DnDTabs;
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
   * dndAcceptType - The token that filter the drop actions
   */
  dndAcceptType: string;
  /**
   *
   */
  classNames: DnDClassNames;
}

/**
 * DnDTabLayout creates a tabLayout where you can drag and drop tabs
 */
export function DnDTabLayout({
  vertical,
  components,
  otherTabs,
  activeTab,
  preventFullScreen,
  onSelect,
  onDrop,
  onDropTab,
  onDeleteTab,
  onNewTab,
  dndAcceptType,
  CustomTab = Tab,
  classNames = {},
}: DnDTabLayoutProps) {
  const { general, header, content, tabsClassName, plusTabClassName } =
    classNames;
  const [fullScreen, setFullScreen] = React.useState(false);

  React.useEffect(() => {
    if (
      activeTab === undefined ||
      (components.find(comp => comp != null && comp.tabId === activeTab) ===
        undefined &&
        components.length > 0)
    ) {
      onSelect && components[0] != null && onSelect(components[0].tabId);
    }
  }, [activeTab, components, onSelect]);

  // DnD hooks (for dropping tabs on the side of the layout)
  const [dropLeftProps, dropLeft] = useDrop(
    dropSpecsFactory(onDrop('LEFT'), dndAcceptType),
  );
  const [dropRightProps, dropRight] = useDrop(
    dropSpecsFactory(onDrop('RIGHT'), dndAcceptType),
  );
  const [dropTopProps, dropTop] = useDrop(
    dropSpecsFactory(onDrop('TOP'), dndAcceptType),
  );
  const [dropBottomProps, dropBottom] = useDrop(
    dropSpecsFactory(onDrop('BOTTOM'), dndAcceptType),
  );

  return (
    <Toolbar
      vertical={vertical}
      className={cx(
        relative,
        general,
        expandWidth,
        css({ backgroundColor: themeVar.colors.BackgroundColor }),
      )}
    >
      <Toolbar.Header className={cx(headerStyle, header)}>
        <DnDTabLayoutHeader
          components={components}
          dndAcceptType={dndAcceptType}
          activeTab={activeTab}
          otherTabs={otherTabs}
          onFullScreen={() => setFullScreen(true)}
          onDeleteTab={onDeleteTab}
          onDropTab={onDropTab}
          onNewTab={onNewTab}
          onSelect={onSelect}
          CustomTab={CustomTab}
          tabsClassName={tabsClassName}
          plusTabClassName={plusTabClassName}
        />
      </Toolbar.Header>
      <Toolbar.Content className={cx(relative, content)}>
        <div className={cx(expandBoth, hideOverflow)}>
          <TabLayoutContentWithFullScreen
            components={components}
            activeTab={activeTab}
            closeFullScreen={() => setFullScreen(false)}
            fullScreen={fullScreen}
            preventFullScreen={preventFullScreen}
          />
          {!fullScreen &&
            (dropLeftProps.canDrop ||
              dropRightProps.canDrop ||
              dropTopProps.canDrop ||
              dropBottomProps.canDrop) && (
              <div
                style={{ top: 0, left: 0 }}
                className={cx(absolute, expandBoth)}
              >
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
