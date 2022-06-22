import * as React from 'react';
import { TabLayoutComponent } from '../../Components/TabLayout/TabLayout';
import { tabLayoutChildrenClassNames } from '../../Components/TabLayout/tabLayoutStyles';
import FileBrowserWithMeta from '../../Editor/Components/FileBrowser/FileBrowser';
import LanguageEditor from '../../Editor/Components/Languages/LanguageEditor';
import { TranslationEditor } from '../../Editor/Components/Languages/TranslationsEditor';
import { DnDTabLayout } from '../../Editor/Components/LinearTabLayout/DnDTabLayout';
import {
  DndLinearLayout,
  LinearLayoutComponents,
} from '../../Editor/Components/LinearTabLayout/LinearLayout';
import ClientLibraryEditor from '../../Editor/Components/ScriptEditors/LibraryEditors/ClientLibraryEditor';
import { wlog } from '../../Helper/wegaslog';

export function TabLayoutTester() {
  const vertical = false;

  const components: TabLayoutComponent[] = [
    { tabId: 'tab1', content: <div>TAB1</div> },
    { tabId: 'tab2', content: <div>TAB2</div> },
    { tabId: 'tab3', content: <div>TAB3</div> },
  ];

  const [activeTab, setActiveTab] = React.useState<string | undefined>(
    undefined,
  );

  const onDrop = React.useCallback(() => {
    wlog('drop');
    return ({ label, type }: { label: string; type: string }) => {
      wlog(`drop factory => ${label} | ${type} `);
    };
  }, []);

  const otherTabs: DropMenuItem<string>[] = [
    { label: 'Yoyo', value: 'ok?' },
    {
      label: 'more of it',
      items: [
        { label: 'one of it', value: '1' },
        { label: 'less of it', value: '-' },
      ],
    },
  ];

  return (
    <DnDTabLayout
      vertical={vertical}
      components={components}
      otherTabs={otherTabs}
      activeTab={activeTab}
      onSelect={setActiveTab}
      classNames={tabLayoutChildrenClassNames}
      dndAcceptType="TEST_COMPONENT"
      onDeleteTab={() => wlog('delete')}
      onDrop={onDrop}
      onDropTab={onDrop}
      onNewTab={() => wlog('new tab')}
    />
  );
}

export default function LinearLayoutTester() {
  const availableLayoutTabs: LinearLayoutComponents = [
    { tabId: 'Files', content: <FileBrowserWithMeta /> },
    { tabId: 'Scripts', content: <ClientLibraryEditor /> },
    {
      tabId: 'Languages',
      items: [
        { tabId: 'Language editor', content: <LanguageEditor /> },
        { tabId: 'Translation manager', content: <TranslationEditor /> },
      ],
    },
  ];

  const initTabs = ['Variables', 'Files', 'Page Editor'];

  return (
    <DndLinearLayout
      tabs={availableLayoutTabs}
      initialLayout={initTabs}
      layoutId={'TestLayoutEditor'}
      classNames={tabLayoutChildrenClassNames}
    />
  );
}
