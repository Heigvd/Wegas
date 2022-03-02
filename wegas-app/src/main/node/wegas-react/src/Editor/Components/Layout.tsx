import { css } from '@emotion/css';
import * as React from 'react';
import { roleCTX } from '../../Components/Contexts/RoleProvider';
import { MaxiLoader } from '../../Components/MaxiLoader';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { DEFAULT_ROLES } from '../../data/Reducer/globalState';
import { State } from '../../data/Reducer/reducers';
import { useStore } from '../../data/Stores/store';
import { visitIndex } from '../../Helper/pages';
import { mainLayoutId } from '../layouts';
import Header from './Header';
import {
  DndLinearLayout,
  LinearLayoutComponents,
} from './LinearTabLayout/LinearLayout';
import { PageContextProvider } from './Page/PageEditor';
import { fullScreenLoaderStyle, PageLoader } from './Page/PageLoader';

const StateMachineEditor = React.lazy(
  () => import('./StateMachine/StateMachineEditor'),
);
const TreeView = React.lazy(() => import('./Variable/VariableTreeView'));
const EntityEditor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(
  () => import('./FileBrowser/FileBrowser'),
);
const LibraryEditor = React.lazy(() => import('./ScriptEditors/LibraryEditor'));
const PlayLocal = React.lazy(() => import('./PlayLocal'));
const PlayServer = React.lazy(() => import('./PlayServer'));
const ThemeEditor = React.lazy(
  () => import('../../Components/Theme/Components/ThemeEditor'),
);
const Languages = React.lazy(() => import('./Languages/Languages'));
const ComponentPalette = React.lazy(() => import('./Page/ComponentPalette'));
const ConnectedComponentProperties = React.lazy(
  () => import('./Page/ComponentProperties'),
);
const PageDisplay = React.lazy(() => import('./Page/PageDisplay'));
const PagesLayout = React.lazy(() => import('./Page/PagesLayout'));
const SourceEditor = React.lazy(() => import('./Page/SourceEditor'));

// const Tester = React.lazy(() => import('../../Testers/Components/MenuTester'));

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: themeVar.colors.SecondaryBackgroundColor,
  padding: '0 2em 1em 2em',
  fontFamily: themeVar.others.TextFont2,
  color: themeVar.colors.DarkTextColor,
});

const availableLayoutTabs: LinearLayoutComponents = [
  // {
  //   tabId: 'Tester',
  //   content: <Tester />,
  // },
  {
    tabId: 'Variables',
    content: <TreeView />,
  },
  {
    tabId: 'State Machine',
    content: <StateMachineEditor />,
  },
  {
    tabId: 'Variable Properties',
    content: <EntityEditor />,
  },
  {
    tabId: 'Files',
    content: <FileBrowserWithMeta />,
  },
  {
    tabId: 'Scripts',
    content: <LibraryEditor />,
  },
  {
    tabId: 'Languages',
    content: <Languages />,
  },
  {
    tabId: 'Client Console',
    content: <PlayLocal />,
  },
  {
    tabId: 'Server Console',
    content: <PlayServer />,
  },
  {
    tabId: 'Theme Editor',
    content: <ThemeEditor />,
  },
  {
    tabId: 'Pages',
    items: [
      {
        tabId: 'Pages Layout',
        content: <PagesLayout />,
      },
      {
        tabId: 'Component Palette',
        content: <ComponentPalette />,
      },
      {
        tabId: 'Page Display',
        content: <PageDisplay />,
      },
      { tabId: 'Source Editor', content: <SourceEditor /> },
      {
        tabId: 'Component Properties',
        content: <ConnectedComponentProperties />,
      },
    ],
  },
];

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

  const scenaristPages = useStore(scenaristPagesSelector).map(
    ({ name, id }) => ({
      tabId: name,
      content: <PageLoader selectedPageId={id} />,
    }),
  );

  const allowedPages = useStore(s => {
    const role = s.global.roles.roles[currentRole];
    return role == null || role.availableTabs;
  });

  const layoutPages = [...availableLayoutTabs, ...scenaristPages].filter(
    ({ tabId }) => allowedPages === true || allowedPages.includes(tabId),
  );

  const initTabs =
    currentRole === DEFAULT_ROLES.SCENARIO_EDITOR.id
      ? ['Variables', 'Files', 'Page Editor']
      : layoutPages.map(page => page.tabId);
  const allowedInitTabs = initTabs.filter(
    t => allowedPages === true || allowedPages.includes(t),
  );

  const initialLayout =
    allowedInitTabs.length > 0 ? allowedInitTabs : allowedInitTabs.slice(0);

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
        <MaxiLoader />
      </div>
    );
  }

  return (
    <div className={layout} id="WegasLayout">
      <Header />
      <PageContextProvider layoutId={mainLayoutId}>
        <DndLinearLayout
          tabs={layoutPages}
          initialLayout={initialLayout}
          layoutId={mainLayoutId}
        />
      </PageContextProvider>
    </div>
  );
}
