import * as React from 'react';
import { Tab, TabComponent } from './DnDTabs';
import { Toolbar } from '../../../Components/Toolbar';
import { Reparentable } from '../Reparentable';
import { cx } from 'emotion';
import {
  grow,
  flex,
  relative,
  expandBoth,
  hideOverflow,
  autoScroll,
  headerStyle,
} from '../../../css/classes';
import { ClassNames, ComponentMap } from './DnDTabLayout';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import { internalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';

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
   * defaultActiveLabel - the selected tab at startup
   */
  defaultActiveLabel?: string;
  /**
   * onSelect - The function to call when a tab is selected
   */
  onSelect?: (label: string) => void;
  /**
   * The tab component to use in this layout
   */
  CustomTab?: TabComponent;
  /**
   * The className for general styling
   */
  classNames?: ClassNames
}

/**
 * TabLayout creates a tabLayout
 */
export function TabLayout({
  vertical,
  components,
  defaultActiveLabel,
  onSelect,
  CustomTab = Tab,
  classNames = {},
}: TabLayoutProps) {
  const {general, header, content} = classNames;
  const[activeLabel, setActiveLabel] = React.useState(defaultActiveLabel);
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(commonTranslations, lang);

  return (
    <Toolbar vertical={vertical} className={cx(relative, general)}>
      <Toolbar.Header className={cx(headerStyle, header)}>
        <div className={cx(flex, grow, autoScroll)}>
          {Object.keys(components).map(label =>
          <CustomTab
            key={label}
            active={label === activeLabel}
            onClick={() => {
              setActiveLabel(label);
              onSelect && onSelect(label);
            }}
          >
            {label}
          </CustomTab>)}
        </div>
      </Toolbar.Header>
      <Toolbar.Content className={cx(relative, content)}>
        <div className={cx(expandBoth, hideOverflow, flex)}>
            {activeLabel && (
              <Reparentable
                id={activeLabel}
                innerClassName={cx(flex, expandBoth)}
                outerClassName={expandBoth}
              >
                <React.Suspense fallback={<div>{i18nValues.loading}...</div>}>
                  {components[activeLabel]}
                </React.Suspense>
              </Reparentable>
            )}
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
