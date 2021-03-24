/* global module*/
import { css } from 'emotion';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api/typings/WegasEntities';
import { languagesCTX } from '../Components/Contexts/LanguagesProvider';
import { themeVar } from '../Components/Style/ThemeVars';
import { entityIs } from '../data/entities';
import { State } from '../data/Reducer/reducers';
import { useStore } from '../data/Stores/store';
import { translate } from '../Editor/Components/FormView/translatable';
import { TabLayout } from '../Editor/Components/LinearTabLayout/TabLayout';
import { PageLoader } from '../Editor/Components/Page/PageLoader';
import { ReparentableRoot } from '../Editor/Components/Reparentable';
import { visitIndex } from '../Helper/pages';
import HostHeader from './HostHeader';
import { OverviewTab } from './Overview/OverviewTab';

const Overview = React.lazy(() => import('./Overview/Overview'));
const PeerReviewPage = React.lazy(() => import('./PeerReviewPage'));

const layoutStyle = css({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  padding: '50px 75px',
  backgroundColor: themeVar.Common.colors.BackgroundColor,
});

export const tabsLineStyle = css({
  borderBottom: '3px solid ' + themeVar.Common.colors.PrimaryColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
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

const availableLayoutTabs = {
  Overview: <Overview />,
} as const;

export default function HostLayout() {
  const { lang } = React.useContext(languagesCTX);

  const { trainerPages, peerReviews } = useStore<TrainerPagesSelector>(
    trainerPagesSelector,
  );
  const trainerTabs = trainerPages.reduce(
    (o, i) => ({ ...o, [i.name]: <PageLoader selectedPageId={i.id} /> }),
    {},
  );
  const peerReviewTabs = peerReviews.reduce(
    (o, peerReview) => ({
      ...o,
      [`Peer review - ${translate(peerReview?.label, lang)}`]: (
        <PeerReviewPage peerReview={peerReview} />
      ),
    }),
    {},
  );

  return (
    <div id="WegasLayout" className={layoutStyle}>
      <HostHeader />
      <ReparentableRoot>
        <TabLayout
          components={{
            ...availableLayoutTabs,
            ...trainerTabs,
            ...peerReviewTabs,
          }}
          CustomTab={OverviewTab}
          classNames={{
            header: tabsLineStyle,
          }}
          defaultActiveLabel={'Overview'}
        />
      </ReparentableRoot>
    </div>
  );
}
