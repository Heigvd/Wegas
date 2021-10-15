import * as React from 'react';
import { TabLayoutComponent } from '../../Components/TabLayout/TabLayout';
import { childTabsStyle } from '../../Components/TabLayout/tabLayoutStyles';
import { childrenHeaderStyle } from '../../css/classes';
import { DnDTabLayout } from '../../Editor/Components/LinearTabLayout/DnDTabLayout2';
import { wlog } from '../../Helper/wegaslog';

export default function TabLayoutTester() {
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
      classNames={{
        header: childrenHeaderStyle,
        tabsClassName: childTabsStyle,
      }}
      dndAcceptType="TEST_COMPONENT"
      onDeleteTab={() => wlog('delete')}
      onDrop={onDrop}
      onDropTab={onDrop}
      onNewTab={() => wlog('new tab')}
    />
  );
}
