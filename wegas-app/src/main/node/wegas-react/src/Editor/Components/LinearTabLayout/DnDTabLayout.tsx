import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { fullscreenCTX } from '../../../Components/Contexts/FullscreenContext';
import { DropMenu } from '../../../Components/DropMenu';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { Tab } from '../../../Components/TabLayout/Tab';
import {
  ClassNames,
  StatelessTabLayoutProps,
  TabLayoutContentWithFullScreen,
} from '../../../Components/TabLayout/TabLayout';
import {
  plusTabStyle,
  tabsStyle,
} from '../../../Components/TabLayout/tabLayoutStyles';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import {
  absolute,
  autoScroll,
  expandBoth,
  expandWidth,
  flex,
  hatchedBackground,
  headerStyle,
  hideOverflow,
  relative,
} from '../../../css/classes';
import {
  EditorTabsTranslations,
  editorTabsTranslations,
} from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
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
  columnGap: '5px',
});

const gapStyle = css({
  columnGap: '5px',
});

const toolsStyle = css({
  position: 'relative',
  display: 'flex',
});

const fadeStyle = css({
  position: 'absolute',
  display: "none", // TODO: do something with tabLayoutChildrenClassNames
  height: '100%',
  width: '24px',
  right: '100%',
  background:
    'linear-gradient(90deg, rgba(255, 255, 255, 0), rgb(241, 239, 243) 100%)',
  pointerEvents: 'none',
});

const noPadding = css({
  padding: 0,
});

const spacerStyle = css({
  flexShrink: 100, // big shrink value so spacer is the first to be shorten
  maxWidth: "5px",
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
    const translatedLabel =
      i18nTabsNames.tabsNames[
        dndTab.label as keyof EditorTabsTranslations['tabsNames']
      ] || dndTab.label;
    const translatedItems = dndTab.items
      ? translateTabs(dndTab.items, i18nTabsNames)
      : undefined;
    return { ...dndTab, label: translatedLabel, items: translatedItems };
  }).sort((a,b) => {
    if (typeof a.label === "string" && typeof b.label === "string") {
      // both label are strings
      return a.label.localeCompare(b.label);
    } else if (typeof a.label === "string") {
      // b is a ReactNode, sort a first
      return -1;
    } else if (typeof b.label === "string") {
      // a is a ReactNode, sort b first
      return 1;
    } else {
      return 0;
    }
  })
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

  const allTabs: DnDTabs = components.map(c => {
      return {
        value: c.tabId,
        label: c.tabId,
      }
  });


  // since componenets may have empty slot
  const indexedComponents = [...components.map((component, index) => ({ component, index}))].filter(x => x);

  return (
    <div className={cx(flex, headerTabStyle, expandWidth)}>
      <div className={cx(flex, autoScroll, gapStyle)}>
        <DropTab
          dndAcceptType={dndAcceptType}
          position={'FIRST'}
          onDrop={onDropTab(0)}
        />
        { indexedComponents.map((indexedComp, i, array) => {
          const label = indexedComp.component.tabId;
          const compIndex = indexedComp.index;
          const translatedOrUndefLabel =
            i18nTabsNames.tabsNames[
              label as keyof EditorTabsTranslations['tabsNames']
            ];
          const translatedLabel = translatedOrUndefLabel
            ? translatedOrUndefLabel
            : label;

          return (
            <React.Fragment key={ `DnDTab-${ label }#${ compIndex}`}>
              {i > 0 && (
                <DropTab
                  dndAcceptType={dndAcceptType}
                  position={'MIDDLE'}
                  onDrop={ onDropTab(compIndex)}
                />
              )}{' '}
              <DragTab
                key={label}
                label={label}
                className={tabsClassNameFn(activeTab === label)}
                onClick={e => {
                  onSelect && onSelect(label);
                  e.target instanceof Element && e.target.scrollIntoView();
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
                  onDrop={ onDropTab(compIndex + 1)}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className={spacerStyle}></div>
      <div className={toolsStyle}>
        <div className={fadeStyle}></div>
        <CustomTab
          className={plusTabClassName ? plusTabClassName : plusTabStyle}
        >
          <DropMenu
            items={translateTabs(allTabs, i18nTabsNames)}
            icon="caret-down"
            buttonClassName={noPadding}
            onSelect={i => {
              onSelect && onSelect(i.value);
            }}
          />
        </CustomTab>

        {showAddTab && (
          <CustomTab
            className={plusTabClassName ? plusTabClassName : plusTabStyle}
          >
            <DropMenu
              items={translateTabs(otherTabs, i18nTabsNames)}
              icon="plus"
              buttonClassName={noPadding}
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

  //HACK: due to bad design, there is two fullScreen state...
  const [localFullScreen, setLocalFullScreen] = React.useState(false);
  const { fullscreen : globalFullScreen, setFullscreen : setGlobalFullScreen } = React.useContext(fullscreenCTX);

  const setFullScreen = React.useCallback((v : boolean) => {
    setLocalFullScreen(v);
    setGlobalFullScreen(v);
  }, [setGlobalFullScreen]);
  const fullScreen = globalFullScreen && localFullScreen;


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
