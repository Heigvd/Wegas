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
  DndLinearLayout, isLinearLayoutItemComponent,
  LinearLayoutComponents, LinearLayoutItemComponent,
} from './LinearTabLayout/LinearLayout';
import {
  defaultPageCTX,
  PageContextProvider,
  pageCTX,
} from './Page/PageEditor';
import {
  fullScreenLoaderStyle,
  MAIN_PAGE_EXPOSE_SIZE_AS,
  PageLoader,
} from './Page/PageLoader';
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
  }, {
    tabId: 'Consoles',
    items: [
      {
        tabId: 'Client Console',
        content: <PlayLocal />,
      },
      {
        tabId: 'Server Console',
        content: <PlayServer />,
      },
    ],
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

/**
 * only keep allowed tabs and subtabs
 */
function filterAllowedInitTabs(initTabs: (string | string[])[], allowedTabs: true | string[]) : ((string | string[])[]){
  if (allowedTabs === true){
    // all tabs allowed
    return initTabs;
  }

  return initTabs.flatMap(tab => {
    if (Array.isArray(tab)) {
      return filterAllowedInitTabs(tab, allowedTabs);
    } else {
      return allowedTabs.includes(tab) ? [tab] : [];
    }
  });
}


function scenaristPagesSelector(s: State) {
  return s.pages.index
    ? visitIndex(s.pages.index.root, item => item).filter(
        item => item.scenaristPage,
      )
    : [];
}


function filterAndFlatten(components: LinearLayoutComponents, allowed: string[]): LinearLayoutItemComponent[] {
  const result : LinearLayoutItemComponent[] = [];
  components.forEach(comp => {
    if(isLinearLayoutItemComponent(comp)) {
      if(allowed.includes(comp.tabId)) {
        result.push(comp);
      }
    }else {
      result.push(...filterAndFlatten(comp.items, allowed));
    }
  });
  return result;
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
          <PageLoader
            selectedPageId={id}
            themeContext="player"
            exposeSizeAs={MAIN_PAGE_EXPOSE_SIZE_AS}
          />
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

  const allLayoutPages =
    [
      ...availableLayoutTabs,
      {
        tabId: 'Scenarist pages',
        items: [...scenaristPages]
      },
      {
        tabId: 'Peer reviews',
        items: [...peerReviewTabs]
      },
    ];

  const layoutPages = (allowedPages === true) ?
    allLayoutPages : filterAndFlatten(allLayoutPages, allowedPages);

  const initTabs =
    currentRole === DEFAULT_ROLES.SCENARIO_EDITOR.id
      ? [['Variables', 'Pages Layout'], ['Variable Properties'], ['Page Display']]
      : layoutPages.map(page => page.tabId);

  const initialLayout = filterAllowedInitTabs(initTabs, allowedPages);

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
