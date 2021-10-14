import { cx } from '@emotion/css';
import * as React from 'react';
import { Loader } from '../../../Components/HOC/Loader';
import { Toolbar } from '../../../Components/Toolbar';
import {
  autoScroll,
  expandBoth,
  flex,
  grow,
  headerStyle,
  hideOverflow,
  relative,
} from '../../../css/classes';
import { commonTranslations } from '../../../i18n/common/common';
import { EditorTabsTranslations } from '../../../i18n/editorTabs/definitions';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { Reparentable } from '../Reparentable';
import { ClassNames } from './DnDTabLayout';
import { Tab, TabComponent } from './DnDTabs';

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

interface TabLayoutHeaderProps {
  /**
   * components - the components to be displayed in the tabLayout
   */
  components: TabLayoutComponent[];
  /**
   * The tab component to use in this layout
   */
  CustomTab?: TabComponent;
}

export function TabLayoutHeader({
  components,
  CustomTab = Tab,
  activeTab,
  onSelect,
}: TabLayoutHeaderProps & TabLayoutStateProps) {
  const i18nTabsNames = useInternalTranslate(editorTabsTranslations);

  return (
    <div className={cx(flex, grow, autoScroll)}>
      {components.map(({ tabId }) => {
        return (
          <CustomTab
            key={tabId}
            active={tabId === activeTab}
            onClick={() => {
              onSelect && onSelect(tabId);
            }}
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
  const i18nValues = useInternalTranslate(commonTranslations);
  const component = components.find(comp => comp.tabId === activeTab)?.content;
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

interface TabLayoutProps extends TabLayoutHeaderProps {
  /**
   * vertical - the orientation of the tab layout
   */
  vertical?: boolean;
  /**
   * The className for general styling
   */
  classNames?: ClassNames;
}

export function StatelessTabLayout({
  vertical,
  components,
  activeTab,
  onSelect,
  CustomTab = Tab,
  classNames = {},
}: TabLayoutProps & TabLayoutStateProps) {
  const { general, header, content } = classNames;
  return (
    <Toolbar vertical={vertical} className={cx(relative, general)}>
      <Toolbar.Header className={cx(headerStyle, header)}>
        <TabLayoutHeader
          components={components}
          CustomTab={CustomTab}
          activeTab={activeTab}
          onSelect={onSelect}
        />
      </Toolbar.Header>
      <Toolbar.Content className={cx(relative, content)}>
        <TabLayoutContent activeTab={activeTab} components={components} />
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
