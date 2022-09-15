import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  autoScroll,
  expandBoth,
  flex,
  flexRow,
  fullScreenContentContainerStyle,
  grow,
  headerStyle,
  hideOverflow,
  relative,
} from '../../css/classes';
import { Reparentable } from '../../Editor/Components/Reparentable';
import { commonTranslations } from '../../i18n/common/common';
import {
  EditorTabsTranslations,
  editorTabsTranslations,
} from '../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { Loader } from '../HOC/Loader';
import { IconButton } from '../Inputs/Buttons/IconButton';
import { modalContentStyle, modalTitleDivStyle } from '../Modal';
import { themeVar } from '../Theme/ThemeVars';
import { Toolbar } from '../Toolbar';
import { Tab, TabComponent } from './Tab';
import { tabsStyle } from './tabLayoutStyles';

const fullScreenTabStyle = css({
  cursor: 'initial',
  borderBottomRightRadius: themeVar.dimensions.BorderRadius,
});

export interface TabLayoutComponent {
  tabId: string;
  content: React.ReactNode;
}

interface TabLayoutStateProps {
  /**
   * activeTab - the id of the selected tab
   */
  activeTab?: string;
  /**
   * onSelect - The function to call when a tab is selected
   */
  onSelect?: (label: string) => void;
}

export interface TabLayoutSharedProps {
  /**
   * components - the components to be displayed in the tabLayout
   */
  components: TabLayoutComponent[];
  /**
   * The tab component to use in this layout
   */
  CustomTab?: TabComponent;
}

interface TabLayoutHeaderProps
  extends TabLayoutSharedProps,
    TabLayoutStateProps {
  tabsClassName?: (active: boolean) => string;
  onFullScreen: () => void;
}

export function TabLayoutHeader({
  components,
  CustomTab = Tab,
  activeTab,
  onSelect,
  onFullScreen,
  tabsClassName,
}: TabLayoutHeaderProps) {
  const i18nTabsNames = useInternalTranslate(editorTabsTranslations);
  const tabsClassNameFn = tabsClassName ? tabsClassName : tabsStyle;

  return (
    <div className={cx(flex, grow, autoScroll)}>
      {components.map(({ tabId }) => {
        return (
          <CustomTab
            key={tabId}
            className={tabsClassNameFn(activeTab === tabId)}
            onClick={() => {
              onSelect && onSelect(tabId);
            }}
            onDoubleClick={onFullScreen}
          >
            {i18nTabsNames.tabsNames[
              tabId as keyof EditorTabsTranslations['tabsNames']
            ] || tabId}
          </CustomTab>
        );
      })}
    </div>
  );
}

type TabLayoutContentProps = Pick<TabLayoutHeaderProps, 'components'> &
  Pick<TabLayoutStateProps, 'activeTab'>;

export function TabLayoutContent({
  components,
  activeTab,
}: TabLayoutContentProps) {
  // debugger;
  const i18nValues = useInternalTranslate(commonTranslations);
  const component = components.find(
    comp => comp != null && comp.tabId === activeTab,
  )?.content;
  return component == null ? (
    <div>{i18nValues.noContent}</div>
  ) : activeTab == null ? (
    <div>{i18nValues.noSelectedTab}</div>
  ) : (
    <div className={cx(expandBoth, hideOverflow, flex)}>
      <Reparentable
        id={activeTab}
        innerClassName={cx(flex, expandBoth)}
        outerClassName={expandBoth}
      >
        <React.Suspense fallback={<Loader />}>{component}</React.Suspense>
      </Reparentable>
    </div>
  );
}

interface TabLayoutContentWithFullScreenProps
  extends TabLayoutContentProps,
    Pick<TabLayoutProps, 'preventFullScreen'> {
  /**
   * allows to display the content in fullscreen mode
   */
  fullScreen: boolean;
  /**
   * allows to close the fullscreen
   */
  closeFullScreen: () => void;
}

export function TabLayoutContentWithFullScreen({
  preventFullScreen,
  fullScreen,
  closeFullScreen,
  ...contentProps
}: TabLayoutContentWithFullScreenProps) {
  const i18nTabsNames = useInternalTranslate(editorTabsTranslations);

  if (fullScreen && !preventFullScreen) {
    const translatedOrUndefLabel =
      i18nTabsNames.tabsNames[
        contentProps.activeTab as keyof EditorTabsTranslations['tabsNames']
      ];
    const translatedLabel = translatedOrUndefLabel
      ? translatedOrUndefLabel
      : contentProps.activeTab;

    return (
      <div
        className={fullScreenContentContainerStyle}
        onClick={closeFullScreen}
      >
        <div
          className={cx(
            modalContentStyle,
            css({ height: '100%', position: 'relative' }),
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className={cx(modalTitleDivStyle, flexRow)}>
            <Tab className={cx(tabsStyle(true), fullScreenTabStyle)}>
              <span className="tab-label">{translatedLabel}</span>
              <IconButton
                icon="compress-alt"
                tooltip="Remove tab"
                onClick={closeFullScreen}
                className={'close-btn'}
              />
            </Tab>
          </div>
          <TabLayoutContent {...contentProps} />
        </div>
      </div>
    );
  } else {
    return <TabLayoutContent {...contentProps} />;
  }
}

export interface ClassNames
  extends Pick<TabLayoutHeaderProps, 'tabsClassName'> {
  general?: string;
  header?: string;
  content?: string;
}

interface TabLayoutProps
  extends Omit<
    TabLayoutHeaderProps,
    keyof TabLayoutStateProps | 'onFullScreen'
  > {
  /**
   * The orientation of the tab layout
   */
  vertical?: boolean;
  /**
   * Prevent the user to set the content fullscreen with a doubleclick on a tab
   */
  preventFullScreen?: boolean;
  /**
   * The className for general styling
   */
  classNames?: ClassNames;
}

export type StatelessTabLayoutProps = TabLayoutProps & TabLayoutStateProps;

export function StatelessTabLayout({
  vertical,
  preventFullScreen,
  components,
  activeTab,
  onSelect,
  CustomTab = Tab,
  classNames = {},
}: StatelessTabLayoutProps) {
  const [fullScreen, setFullScreen] = React.useState(false);
  const { general, header, content, tabsClassName } = classNames;
  return (
    <Toolbar vertical={vertical} className={cx(relative, general)}>
      <Toolbar.Header className={cx(headerStyle, header)}>
        <TabLayoutHeader
          components={components}
          CustomTab={CustomTab}
          activeTab={activeTab}
          onSelect={onSelect}
          onFullScreen={() => setFullScreen(true)}
          tabsClassName={tabsClassName}
        />
      </Toolbar.Header>
      <Toolbar.Content className={cx(relative, content)}>
        <TabLayoutContentWithFullScreen
          activeTab={activeTab}
          components={components}
          preventFullScreen={preventFullScreen}
          fullScreen={fullScreen}
          closeFullScreen={() => setFullScreen(false)}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}

export function TabLayout(props: TabLayoutProps) {
  const { components } = props;
  const [activeTab, setActiveTab] = React.useState<string | undefined>(
    components[0]?.tabId,
  );
  return (
    <StatelessTabLayout
      {...props}
      activeTab={activeTab}
      onSelect={setActiveTab}
    />
  );
}
