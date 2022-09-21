import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api';
import { languagesCTX } from '../../Components/Contexts/LanguagesProvider';
import { roleCTX } from '../../Components/Contexts/RoleProvider';
import { MaxiLoader } from '../../Components/MaxiLoader';
import { TabLayoutComponent } from '../../Components/TabLayout/TabLayout';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { expandWidth } from '../../css/classes';
import { entityIs } from '../../data/entities';
import { translate } from '../../data/i18n';
import { DEFAULT_ROLES } from '../../data/Reducer/globalState';
import { State } from '../../data/Reducer/reducers';
import { useStore } from '../../data/Stores/store';
import { visitIndex } from '../../Helper/pages';
import PeerReviewPage from '../../Host/PeerReview/PeerReviewPage';
import { mainLayoutId } from '../layouts';
import Header from './Header';
import {
  DndLinearLayout,
  LinearLayoutComponents,
} from './LinearTabLayout/LinearLayout';
import {
  defaultPageCTX,
  PageContextProvider,
  pageCTX,
} from './Page/PageEditor';
import { fullScreenLoaderStyle, PageLoader } from './Page/PageLoader';
import { AllLibraryEditor } from './ScriptEditors/LibraryEditors/AllLibraryEditor';

const StateMachineEditor = React.lazy(
  () => import('./StateMachine/StateMachineEditor'),
);
const TreeView = React.lazy(() => import('./Variable/VariableTreeView'));
const EntityEditor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(
  () => import('./FileBrowser/FileBrowser'),
);
const ClientLibraryEditor = React.lazy(
  () => import('./ScriptEditors/LibraryEditors/ClientLibraryEditor'),
);
const ServerLibraryEditor = React.lazy(
  () => import('./ScriptEditors/LibraryEditors/ServerLibraryEditor'),
);
const StyleLibraryEditor = React.lazy(
  () => import('./ScriptEditors/LibraryEditors/StyleLibraryEditor'),
);
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

const FindAndReplace = React.lazy(() => import('./FindAndReplace'));

//const Tester = React.lazy(() => import('../../Testers/ScriptTester'));

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: themeVar.colors.SecondaryBackgroundColor,
  padding: '1em',
  fontFamily: themeVar.others.TextFont2,
  color: themeVar.colors.DarkTextColor,
});

const availableLayoutTabs: LinearLayoutComponents = [
  /*{
    tabId: 'Tester',
    content: <Tester />,
  },*/
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
    tabId: 'Libraries',
    items: [
      {
        tabId: 'Client',
        content: <ClientLibraryEditor />,
      },
      {
        tabId: 'Server',
        content: <ServerLibraryEditor />,
      },
      {
        tabId: 'Style',
        content: <StyleLibraryEditor />,
      },
      {
        tabId: 'AllLibs',
        content: <AllLibraryEditor />,
      },
    ],
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
    tabId: 'Find & Replace',
    content: <FindAndReplace />,
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
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const { lang } = React.useContext(languagesCTX);
  const [loading, setLoading] = React.useState(true);
  const { currentRole } = React.useContext(roleCTX);

  const scenaristPages = useStore(scenaristPagesSelector).map(
    ({ name, id }) => ({
      tabId: name,
      content: (
        <pageCTX.Provider value={defaultPageCTX}>
          <PageLoader selectedPageId={id} themeContext="player" />
        </pageCTX.Provider>
      ),
    }),
  );

  const peerReviews = useStore(s => {
    return Object.values(s.variableDescriptors).filter(descriptor =>
      entityIs(descriptor, 'PeerReviewDescriptor'),
    ) as IPeerReviewDescriptor[];
  });

  const peerReviewTabs = peerReviews.map<TabLayoutComponent>(peerReview => ({
    tabId: `Peer review ${translate(peerReview?.label, lang)}`,
    content: <PeerReviewPage peerReview={peerReview} />,
  }));

  const allowedPages = useStore(s => {
    const role = s.global.roles.roles[currentRole];
    return role == null || role.availableTabs;
  });

  const layoutPages = [
    ...availableLayoutTabs,
    ...scenaristPages,
    ...peerReviewTabs,
  ].filter(
    ({ tabId }) => allowedPages === true || allowedPages.includes(tabId),
  );

  const initTabs =
    currentRole === DEFAULT_ROLES.SCENARIO_EDITOR.id
      ? ['Variables', 'Files']
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
      setLoading(false);
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
    <>
      {WEGAS_SAFE_MODE && (
        <div
          className={cx(
            expandWidth,
            css({
              textAlign: 'center',
              color: 'white',
              fontSize: '20px',
              lineHeight: '40px',
              backgroundColor: 'var(--colors-errorcolor)',
            }),
          )}
        >
          SAFE MODE
          <br />
          All client scripts are disabled
        </div>
      )}
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
    </>
  );
}
