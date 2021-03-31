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
  button: {
    '&.iconOnly object svg': {
      cursor: 'pointer',
      color: '#ff4',
      '&:hover': {
        fill: '#ff4',
      }
    }
  }
});

export const tabsLineStyle = css({
  borderBottom: '3px solid ' + themeVar.Common.colors.PrimaryColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
});

/*const trainerButtonsStyle = css({
  button: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: trainerTheme.colors.PrimaryColor,
    color: trainerTheme.colors.LightTextColor,
    borderStyle: 'none',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: trainerTheme.borders.ButtonsBorderRadius,
    ['&.iconOnly']: {
      backgroundColor: 'transparent',
      color: trainerTheme.colors.MainTextColor,
      padding: 0,
    },
       .css-${modalCloseDivStyle.name}: {
      color: trainerTheme.colors.PrimaryColor
    }
    ['&:not(.disabled):not(.readOnly):not(.iconOnly):not(.noBackground):not(.confirmBtn):not(.tox-tbtn):hover']: {
      color: trainerTheme.colors.LightTextColor,
      backgroundColor: trainerTheme.colors.DarkPrimaryColor,
    },
  },
  'svg.fa-window-close': {
    color: trainerTheme.colors.PrimaryColor
  },
}); */

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
      [`Peer review ${translate(peerReview?.label, lang)}`]: (
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
