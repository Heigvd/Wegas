import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { DropMenu } from '../../../Components/DropMenu';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { Tab } from '../../../Components/TabLayout/Tab';
import {
  ClassNames,
  StatelessTabLayoutProps,
  TabLayoutContentWithFullScreen,
} from '../../../Components/TabLayout/TabLayout';
import { tabsStyle } from '../../../Components/TabLayout/tabLayoutStyles';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import {
  absolute,
  autoScroll,
  expandBoth,
  flex,
  grow,
  hatchedBackground,
  hideOverflow,
  relative,
} from '../../../css/classes';
import { EditorTabsTranslations } from '../../../i18n/editorTabs/definitions';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { DragTab, DropTab } from './DnDTabs2';
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

type DropAction = (item: { label: string; type: string }) => void;

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
    Pick<ClassNames, 'tabsClassName'> {
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
}: DnDTabLayoutHeaderProps) {
  const i18nTabsNames = useInternalTranslate(editorTabsTranslations);
  const tabsClassNameFn = tabsClassName ? tabsClassName : tabsStyle;

  return (
    <div className={cx(flex, grow, autoScroll)}>
      {components.map(({ tabId: label }, i, array) => {
        const translatedOrUndefLabel =
          i18nTabsNames.tabsNames[
            label as keyof EditorTabsTranslations['tabsNames']
          ];
        const translatedLabel = translatedOrUndefLabel
          ? translatedOrUndefLabel
          : label;

        return (
          <React.Fragment key={`DnDTab-#${i}`}>
            <DropTab
              dndAcceptType={dndAcceptType}
              position={i === 0 ? 'FIRST' : 'MIDDLE'}
              onDrop={onDropTab(i)}
            />
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
              {translatedLabel}
              <IconButton
                icon="times"
                tooltip="Remove tab"
                onClick={() => onDeleteTab(label)}
                className={'close-btn'}
              />
            </DragTab>
            {i === array.length - 1 && (
              <>
                <DropTab
                  dndAcceptType={dndAcceptType}
                  position={'LAST'}
                  onDrop={onDropTab(i + 1)}
                />
                {otherTabs && otherTabs.length > 0 && (
                  <CustomTab key={'ADDER_TAB'}>
                    <DropMenu
                      items={otherTabs}
                      icon="plus"
                      onSelect={i => {
                        onSelect && onSelect(i.value);
                        onNewTab(String(i.value));
                      }}
                    />
                  </CustomTab>
                )}
              </>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export type DnDTabs = DropMenuItem<string>[];

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
}: // areChildren,
DnDTabLayoutProps) {
  const { general, header, content, tabsClassName } = classNames;
  const [fullScreen, setFullScreen] = React.useState(false);

  React.useEffect(() => {
    if (
      activeTab === undefined ||
      (components.find(comp => comp.tabId === activeTab) === undefined &&
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
        css({ backgroundColor: themeVar.colors.BackgroundColor }),
      )}
    >
      <Toolbar.Header className={header}>
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
