import * as React from 'react';
import PageLoader from './PageLoader';
import { TabLayout } from '../Tabs';
import { deserialize } from '../AutoImport';

export default function TabPageLoader({
  tabs,
}: {
  tabs: { label: WegasComponent | string; id: string }[];
}) {
  return (
    <TabLayout
      tabs={tabs.map(
        t => ('string' === typeof t.label ? t.label : deserialize(t.label)),
      )}
    >
      {tabs.map(t => <PageLoader key={t.id} id={t.id} />)}
    </TabLayout>
  );
}
