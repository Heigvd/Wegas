import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';
import { useStore } from '../../data/Stores/store';
import { visitIndex } from '../../Helper/pages';
import { PageLoader } from './Page/PageLoader';
import { ComponentMap } from './LinearTabLayout/DnDTabLayout';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { State } from '../../data/Reducer/reducers';
import { roleCTX } from '../../Components/Contexts/RoleProvider';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { commonTranslations } from '../../i18n/common/common';

const StateMachineEditor = React.lazy(() => import('./StateMachineEditor'));
const PageEditor = React.lazy(() => import('./Page/PageEditor'));
const TreeView = React.lazy(() => import('./Variable/VariableTreeView'));
const EntityEditor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(
  () => import('./FileBrowser/FileBrowser'),
);
const LibraryEditor = React.lazy(() => import('./ScriptEditors/LibraryEditor'));
const PlayLocal = React.lazy(() => import('./PlayLocal'));
const PlayServer = React.lazy(() => import('./PlayServer'));
const InstancesEditor = React.lazy(
  () => import('./Variable/InstanceProperties'),
);
const ThemeEditor = React.lazy(
  () => import('../../Components/Theme/Components/ThemeEditor'),
);
const Languages = React.lazy(() => import('./Languages/Languages'));
// const Tester = React.lazy(() => import('../../Testers/FlowchartTester'));

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: themeVar.colors.SecondaryBackgroundColor,
  padding: '0 2em 1em 2em',
  fontFamily: themeVar.others.TextFont2,
  color: themeVar.colors.DarkTextColor,
});

export const availableLayoutTabs = {
  // Tester: <Tester />,
  Variables: <TreeView />,
  'State Machine': <StateMachineEditor />,
  'Variable Properties': <EntityEditor />,
  Files: <FileBrowserWithMeta />,
  Scripts: <LibraryEditor />,
  Languages: <Languages />,
  'Client Console': <PlayLocal />,
  'Server Console': <PlayServer />,
  'Instances Editor': <InstancesEditor />,
  'Theme Editor': <ThemeEditor />,
  'Page Editor': <PageEditor />,
  // Tester: <Tester />,
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
  const { currentRole } = React.useContext(roleCTX);
  const i18nValues = useInternalTranslate(commonTranslations);
  const scenaristPages: ComponentMap = useStore(scenaristPagesSelector).reduce(
    (o, i) => ({ ...o, [i.name]: <PageLoader selectedPageId={i.id} /> }),
    {},
  );

  const scenaristTabs = Object.keys(scenaristPages);
  const layoutPages = {
    ...(currentRole === 'SCENARIO_EDITOR' ? availableLayoutTabs : {}),
    ...scenaristPages,
  };
  const loading = Object.keys(layoutPages).length === 0;
  const initialLayout = (
    currentRole === 'CONTENT_EDITOR' && scenaristTabs.length > 0
      ? scenaristTabs
      : ['Variables', 'Files', 'Page Editor']
  ) as (keyof typeof layoutPages)[];

  if (loading) {
    return <pre>{i18nValues.loading + '...'}</pre>;
  }

  return (
    <div className={layout} id="WegasLayout">
      <Header />
      <DndLinearLayout
        tabs={layoutPages}
        initialLayout={initialLayout}
        layoutId={mainLayoutId}
      />
    </div>
  );
}
