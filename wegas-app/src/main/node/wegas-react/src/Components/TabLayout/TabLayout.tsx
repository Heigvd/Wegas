import { cx } from '@emotion/css';
import * as React from 'react';
import {
  autoScroll,
  expandBoth,
  flex,
  grow,
  headerStyle,
  hideOverflow,
  relative,
} from '../../css/classes';
import { Reparentable } from '../../Editor/Components/Reparentable';
import { commonTranslations } from '../../i18n/common/common';
import { EditorTabsTranslations } from '../../i18n/editorTabs/definitions';
import { editorTabsTranslations } from '../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { Loader } from '../HOC/Loader';
import { Toolbar } from '../Toolbar';
import { tabsStyle } from './tabLayoutStyles';

interface TabInternalProps extends ClassStyleId {
  /**
   * onClick - the function to be called when the tab is clicked
   */
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  /**
   * onDoubleClick - the function to be called when the tab is double clicked
   */
  onDoubleClick?: React.DOMAttributes<HTMLDivElement>['onDoubleClick'];
}

export type TabProps = React.PropsWithChildren<TabInternalProps>;

export const Tab = React.forwardRef<HTMLDivElement, TabProps>(
  (
    { onClick, onDoubleClick, id, style, className, children }: TabProps,
    ref: React.RefObject<HTMLDivElement>,
  ) => {
    return (
      <div
        ref={ref}
        id={id}
        style={style}
        className={className}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        {children}
      </div>
    );
  },
);

Tab.displayName = 'Tab';

export type TabComponent = typeof Tab;

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

interface TabLayoutSharedProps {
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
}

export function TabLayoutHeader({
  components,
  CustomTab = Tab,
  activeTab,
  onSelect,
  tabsClassName,
}: TabLayoutHeaderProps) {
  const i18nTabsNames = useInternalTranslate(editorTabsTranslations);
  const classNameFn = tabsClassName ? tabsClassName : tabsStyle;

  return (
    <div className={cx(flex, grow, autoScroll)}>
      {components.map(({ tabId }) => {
        return (
          <CustomTab
            key={tabId}
            onClick={() => {
              onSelect && onSelect(tabId);
            }}
            className={classNameFn(activeTab === tabId)}
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

export interface ClassNames
  extends Pick<TabLayoutHeaderProps, 'tabsClassName'> {
  general?: string;
  header?: string;
  content?: string;
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
  const { general, header, content, tabsClassName } = classNames;
  return (
    <Toolbar vertical={vertical} className={cx(relative, general)}>
      <Toolbar.Header className={cx(headerStyle, header)}>
        <TabLayoutHeader
          components={components}
          CustomTab={CustomTab}
          activeTab={activeTab}
          onSelect={onSelect}
          tabsClassName={tabsClassName}
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
