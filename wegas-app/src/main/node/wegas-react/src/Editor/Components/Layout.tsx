import { css } from '@emotion/css';
import * as React from 'react';
import { roleCTX } from '../../Components/Contexts/RoleProvider';
import { TumbleLoader } from '../../Components/Loader';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { State } from '../../data/Reducer/reducers';
import { useStore } from '../../data/Stores/store';
import { visitIndex } from '../../Helper/pages';
import Header from './Header';
import { ComponentMap } from './LinearTabLayout/DnDTabLayout';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';
import { fullScreenLoaderStyle, PageLoader } from './Page/PageLoader';

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
const Tester = React.lazy(
  () => import('../../Testers/Components/TabLayoutTester'),
);

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
  Tester: <Tester />,
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
  const timer = React.useRef<NodeJS.Timeout | undefined>();
  const [loading, setLoading] = React.useState(true);
  const { currentRole } = React.useContext(roleCTX);
  const scenaristPages: ComponentMap = useStore(scenaristPagesSelector).reduce(
    (o, i) => ({ ...o, [i.name]: <PageLoader selectedPageId={i.id} /> }),
    {},
  );

  const allowedPages = useStore(s => {
    const role = s.global.roles.roles[currentRole];
    return role == null || role.availableTabs;
  });

  const layoutPages = Object.entries({
    ...availableLayoutTabs,
    ...scenaristPages,
  })
    .filter(([t]) => allowedPages === true || allowedPages.includes(t))
    .reduce((o, [k, v]) => ({ ...o, [k]: v }), {});
  const initTabs = ['Variables', 'Files', 'Page Editor'];
  const allowedInitTabs = initTabs.filter(
    t => allowedPages === true || allowedPages.includes(t),
  );

  const initialLayout = (
    allowedInitTabs.length > 0 ? allowedInitTabs : allowedInitTabs.slice(0)
  ) as (keyof typeof layoutPages)[];

  React.useEffect(() => {
    if (timer.current != null) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      setLoading(Object.keys(layoutPages).length === 0);
    }, 2500);
    return () => {
      if (timer.current != null) {
        clearTimeout(timer.current);
      }
    };
  }, [layoutPages]);

  if (loading) {
    return (
      <div className={fullScreenLoaderStyle}>
        <TumbleLoader />
      </div>
    );
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
