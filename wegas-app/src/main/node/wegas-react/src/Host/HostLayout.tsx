/* global module*/
import { css } from '@emotion/css';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api/typings/WegasEntities';
import { languagesCTX } from '../Components/Contexts/LanguagesProvider';
import { TumbleLoader } from '../Components/Loader';
import {
  TabLayout,
  TabLayoutComponent,
} from '../Components/TabLayout/TabLayout';
import { themeVar } from '../Components/Theme/ThemeVars';
import { entityIs } from '../data/entities';
import { State } from '../data/Reducer/reducers';
import { useStore } from '../data/Stores/store';
import { translate } from '../Editor/Components/FormView/translatable';
import {
  fullScreenLoaderStyle,
  PageLoader,
} from '../Editor/Components/Page/PageLoader';
import { ReparentableRoot } from '../Editor/Components/Reparentable';
import { visitIndex } from '../Helper/pages';
import { wlog } from '../Helper/wegaslog';
import HostHeader from './HostHeader';
import { OverviewTab } from './Overview/OverviewTab';

const Overview = React.lazy(() => import('./Overview/Overview'));
const PeerReviewPage = React.lazy(() => import('./PeerReview/PeerReviewPage'));

const layoutStyle = css({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  padding: '50px 75px',
  backgroundColor: themeVar.colors.BackgroundColor,
  button: {
    '&.iconOnly object svg': {
      cursor: 'pointer',
      color: '#ff4',
      '&:hover': {
        fill: '#ff4',
      },
    },
  },
});

export const tabsLineStyle = css({
  borderBottom: '3px solid ' + themeVar.colors.PrimaryColor,
  backgroundColor: themeVar.colors.BackgroundColor,
});

export const trainerLayoutId = 'TrainerLayout';

interface TrainerPagesSelector {
  trainerPages: PageIndexPage[];
  peerReviews: IPeerReviewDescriptor[];
}

function trainerPagesSelector(s: State): TrainerPagesSelector {
  return {
    trainerPages: s.pages.index
      ? visitIndex(s.pages.index.root, item => item).filter(
          item => item.trainerPage,
        )
      : [],
    peerReviews: Object.values(s.variableDescriptors).filter(descriptor =>
      entityIs(descriptor, 'PeerReviewDescriptor'),
    ) as IPeerReviewDescriptor[],
  };
}

const availableLayoutTabs: TabLayoutComponent[] = [
  {
    tabId: 'Overview',
    content: <Overview />,
  },
];

export default function HostLayout() {
  const timer = React.useRef<NodeJS.Timeout | undefined>();
  const { lang } = React.useContext(languagesCTX);
  const [loading, setLoading] = React.useState(true);
  const { trainerPages, peerReviews } =
    useStore<TrainerPagesSelector>(trainerPagesSelector);
  const trainerTabs = trainerPages.map<TabLayoutComponent>(page => ({
    tabId: page.name,
    content: <PageLoader selectedPageId={page.id} />,
  }));
  const peerReviewTabs = peerReviews.map<TabLayoutComponent>(peerReview => ({
    tabId: `Peer review ${translate(peerReview?.label, lang)}`,
    content: <PeerReviewPage peerReview={peerReview} />,
  }));

  React.useEffect(() => {
    if (timer.current != null) {
      clearTimeout(timer.current);
    }
    wlog(Object.keys(OverviewTab).length);
    timer.current = setTimeout(() => {
      setLoading(Object.keys(OverviewTab).length === 0);
    }, 2500);
    return () => {
      if (timer.current != null) {
        clearTimeout(timer.current);
      }
    };
  }, []);
  if (loading) {
    return (
      <div className={fullScreenLoaderStyle}>
        <TumbleLoader />
      </div>
    );
  }
  return (
    <div id="WegasLayout" className={layoutStyle}>
      <HostHeader />
      <ReparentableRoot>
        <TabLayout
          components={[
            ...availableLayoutTabs,
            ...trainerTabs,
            ...peerReviewTabs,
          ]}
          CustomTab={OverviewTab}
          classNames={{
            header: tabsLineStyle,
          }}
        />
      </ReparentableRoot>
    </div>
  );
}
