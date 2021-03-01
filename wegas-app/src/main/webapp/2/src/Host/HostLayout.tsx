/* global module*/
import { css } from 'emotion';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api/typings/WegasEntities';
import { languagesCTX } from '../Components/Contexts/LanguagesProvider';
import { entityIs } from '../data/entities';
import { State } from '../data/Reducer/reducers';
import { useStore } from '../data/Stores/store';
import { translate } from '../Editor/Components/FormView/translatable';
import { TabLayout } from '../Editor/Components/LinearTabLayout/TabLayout';
import { PageLoader } from '../Editor/Components/Page/PageLoader';
import { ReparentableRoot } from '../Editor/Components/Reparentable';
import { visitIndex } from '../Helper/pages';
import HostHeader from './HostHeader';
import { trainerTheme } from './Overview/HostTheme';
import { OverviewTab } from './Overview/OverviewTab';

const Overview = React.lazy(() => import('./Overview/Overview'));
const PeerReviewPage = React.lazy(() => import('./PeerReviewPage'));

const layoutStyle = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  padding: '50px 75px',
  fontFamily: trainerTheme.text.TextFont1,
  backgroundColor: trainerTheme.colors.BackgroundColor,
});

const tabsLineStyle = css({
  borderBottom: '3px solid ' + trainerTheme.colors.PrimaryColor,
  backgroundColor: trainerTheme.colors.BackgroundColor
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
          components={{ ...trainerTabs, ...availableLayoutTabs, ...peerReviewTabs }}
          CustomTab={OverviewTab}
          classNames= {{
            header: tabsLineStyle
          }}
          defaultActiveLabel={'Overview'}
          />
      </ReparentableRoot>
      {/* <DndLinearLayout
        tabs={{ ...trainerTabs, ...availableLayoutTabs, ...peerReviewTabs }}
        initialLayout={['Overview']}
        layoutId={trainerLayoutId}
        CustomTab={OverviewTab}
        classNames= {{
          header: tabsLineStyle
        }}
      /> */}
    </div>
  );
}

// function mount() {
//   render(
//     <FeaturesProvider>
//       <LanguagesProvider>
//         <ClassesProvider>
//           <LibrariesLoader>
//             <ThemeProvider contextName="player">
//               <HostLayout />
//             </ThemeProvider>
//           </LibrariesLoader>
//         </ClassesProvider>
//       </LanguagesProvider>
//     </FeaturesProvider>,
//     document.getElementById('root'),
//   );
// }
// mount();
