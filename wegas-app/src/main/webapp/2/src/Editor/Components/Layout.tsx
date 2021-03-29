import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';
import { useStore } from '../../data/Stores/store';
import { visitIndex } from '../../Helper/pages';
import { PageLoader } from './Page/PageLoader';
import { ComponentMap } from './LinearTabLayout/DnDTabLayout';
import { themeVar } from '../../Components/Style/ThemeVars';
import { State } from '../../data/Reducer/reducers';

const StateMachineEditor = React.lazy(() => import('./StateMachineEditor'));
const PageEditor = React.lazy(() => import('./Page/PageEditor'));
const TreeView = React.lazy(() => import('./Variable/VariableTree'));
const EntityEditor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(
  () => import('./FileBrowser/FileBrowser'),
);
const LibraryEditor = React.lazy(() => import('./ScriptEditors/LibraryEditor'));
const LanguageEditor = React.lazy(() => import('./LanguageEditor'));
const PlayLocal = React.lazy(() => import('./PlayLocal'));
const PlayServer = React.lazy(() => import('./PlayServer'));
const InstancesEditor = React.lazy(
  () => import('./Variable/InstanceProperties'),
);
const ThemeEditor = React.lazy(
  () => import('../../Components/Style/ThemeEditor'),
);
//const Tester = React.lazy(() => import('../../Testers/Components/InfoBulletTester'));

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
});

export const availableLayoutTabs = {
  //Tester: <Tester />,
  Variables: <TreeView />,
  'State Machine': <StateMachineEditor />,
  'Variable Properties': <EntityEditor />,
  Files: <FileBrowserWithMeta />,
  Scripts: <LibraryEditor />,
  'Language Editor': <LanguageEditor />,
  'Client Console': <PlayLocal />,
  'Server Console': <PlayServer />,
  'Instances Editor': <InstancesEditor />,
  'Theme Editor': <ThemeEditor />,
  'Page Editor': <PageEditor />,
} as const;

export type AvailableLayoutTab = keyof typeof availableLayoutTabs;

export const mainLayoutId = 'MainEditorLayout';

function scenaristPagesSelector(s: State) {
  return s.pages.index
    ? visitIndex(s.pages.index.root, item => item).filter(
        item => item.scenaristPage,
      )
    : [];
}

export default function Layout() {
  const scenaristPages: ComponentMap = useStore(scenaristPagesSelector).reduce(
    (o, i) => ({ ...o, [i.name]: <PageLoader selectedPageId={i.id} /> }),
    {},
  );

  return (
    <div
      className={
        layout + ' ' + css({ fontFamily: themeVar.Common.others.TextFont2 })
      }
      id="WegasLayout"
    >
      <Header />
      <DndLinearLayout
        tabs={{ ...availableLayoutTabs, ...scenaristPages }}
        initialLayout={[['Variables', 'Files'], ['Page Editor']]}
        layoutId={mainLayoutId}
      />
    </div>
  );
}
