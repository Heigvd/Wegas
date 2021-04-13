import { css, cx } from 'emotion';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { languagesCTX } from '../../Components/Contexts/LanguagesProvider';
import { CheckBox } from '../../Components/Inputs/Boolean/CheckBox';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../Components/Style/ThemeVars';
import { Toolbar } from '../../Components/Toolbar';
import {
  autoScroll,
  defaultMarginTop,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
  showOverflow,
} from '../../css/classes';
import { updateDescriptor } from '../../data/Reducer/VariableDescriptorReducer';
import { instantiate } from '../../data/scriptable';
import { Game, GameModel, Player } from '../../data/selectors';
import { store, useStore } from '../../data/Stores/store';
import {
  createTranslatableContent,
  translate,
} from '../../Editor/Components/FormView/translatable';
import { createScript } from '../../Helper/wegasEntites';
import { InfoOverlay } from '../InfoOverlay';
import { PRTable } from './PeerReviewTable';
import { ExtraProps, PRChart } from './PeerReviewChart';
import {
  PeerReviewDescriptorAPI,
  PeerReviewStateSelector,
} from '../../API/peerReview.api';
import { addPopup, popupDispatch } from '../../Components/PopupManager';
import { internalTranslate } from '../../i18n/internalTranslator';
import { peerReviewTranslations } from '../../i18n/peerReview/peerReview';
// import { testPRData } from './PRinterfaceTests';

const prStateStyle = css({
  borderRadius: '10px',
  backgroundColor: themeVar.Common.colors.SecondaryBackgroundColor,
  color: themeVar.Common.colors.DarkTextColor,
  boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.2)',
  padding: '10px',
  minWidth: '200px',
  minHeight: '120px',
  textAlign: 'center',
});

const prActiveStateStyle = css({
  backgroundColor: themeVar.Common.colors.PrimaryColor,
  color: themeVar.Common.colors.LightTextColor,
});

const stateBarStyle = css({
  overflowX: 'auto',
  button: {
    fontSize: '30px',
  },
});

interface PeerReviewPageProps {
  peerReview: IPeerReviewDescriptor;
}

export type DataOverviewItem = OverviewItem & {
  variable: string;
};

export type ReviewsItemValue =
  | string
  | number
  | (number | null)[]
  | (string | null)[];

export interface DataReviewItem {
  [id: string]: ReviewsItemValue;
  variable: string;
}

export type DataItem = DataOverviewItem | DataReviewItem;

export interface PRTableData<
  DataItem extends DataOverviewItem | DataReviewItem
> {
  structures: TableStructure[];
  data: {
    [id: string]: DataItem;
  };
}

export interface StructureItem {
  id: string;
  label: string;
  formatter: string;
  nodeFormatter?: string;
  allowHTML?: boolean;
}

export type OverviewColor = 'green' | 'orange' | 'red' | 'grey' | undefined;

type PeerReviewTeamState =
  | 'editing'
  | 'ready'
  | 'reviewing'
  | 'done'
  | 'commenting'
  | 'completed'
  | 'closed'
  | 'evicted';

interface OverviewItem {
  done: string;
  done_color: OverviewColor;
  commented: string;
  comments_color?: OverviewColor;
  color: OverviewColor;
  internal_status: PeerReviewTeamState;
  status: string;
}

interface TableStructure {
  id?: string;
  title: string;
  items: StructureItem[];
}
export interface PeerReviewData {
  structure: {
    overview: TableStructure[];
    reviews: TableStructure[];
    comments: TableStructure[];
  };
  data: {
    [id: string]: {
      overview: OverviewItem;
      reviews: {
        [id: string]: ReviewsItemValue;
      };
      comments: {
        [id: string]: ReviewsItemValue;
      };
    };
  };
  extra: ExtraProps;
  variable: {
    [id: string]: string;
  };
}

interface IData {
  overview: PRTableData<DataOverviewItem>;
  reviews: PRTableData<DataReviewItem>;
  comments: PRTableData<DataReviewItem>;
  rawData: PeerReviewData;
}

//add content in the State
interface LayoutState {
  show: boolean;
  title: string;
  content: string;
  button: React.RefObject<HTMLButtonElement>;
}

const defaultLayoutState: LayoutState = {
  show: false,
  title: 'No title',
  content: 'No content',
  button: React.createRef(),
};

type PeerReviewStatus =
  | 'NOT_STARTED'
  | 'REVIEWING'
  | 'COMMENTING'
  | 'CLOSED'
  | 'N/A'
  | undefined;
type PeerReviewTeamStatus = PeerReviewStatus | 'EVICTED';

function globalPRStatus(
  overviewState: { [id: string]: OverviewItem } | undefined,
): PeerReviewStatus {
  let globalStatus: PeerReviewStatus;
  if (overviewState != null) {
    for (const teamId in overviewState) {
      const team = store.getState().teams[teamId];
      const game = Game.selectCurrent();
      const overviewTeam = overviewState[teamId];
      let teamStatus: PeerReviewTeamStatus = 'N/A';
      if (
        game['@class'] === 'DebugGame' ||
        !team ||
        (team['@class'] !== 'DebugTeam' && team['players'].length > 0)
      ) {
        switch (overviewTeam.internal_status) {
          case 'editing':
          case 'ready':
            teamStatus = 'NOT_STARTED';
            break;
          case 'reviewing':
          case 'done':
            teamStatus = 'REVIEWING';
            break;
          case 'commenting':
          case 'completed':
            teamStatus = 'COMMENTING';
            break;
          case 'closed':
            teamStatus = 'CLOSED';
            break;
          case 'evicted':
            teamStatus = 'EVICTED';
            break;
          default:
            teamStatus = 'N/A';
        }
        if (teamStatus !== 'EVICTED') {
          if (!globalStatus) {
            globalStatus = teamStatus;
          } else if (globalStatus !== teamStatus) {
            globalStatus = 'N/A';
          }
        }
      }
    }
  }
  return globalStatus;
}

export default function PeerReviewPage({ peerReview }: PeerReviewPageProps) {
  const [layoutState, setLayoutState] = React.useState<LayoutState>(
    defaultLayoutState,
  );

  const { lang } = React.useContext(languagesCTX);
  const [data, setData] = React.useState<IData>();
  const spr = useStore(() => instantiate(peerReview));

  const i18nValues = internalTranslate(peerReviewTranslations, lang);
  const getData = React.useCallback(() => {
    let mounted = true;
    VariableDescriptorAPI.runScript(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      createScript(`ReviewHelper.summarize("${peerReview.name}")`),
      undefined,
      true,
    ).then((res: PeerReviewData) => {
      // Test purposes
      //const res = testPRData;

      if (mounted) {
        setData({
          overview: {
            structures: res.structure.overview,
            data: Object.entries(res.variable).reduce<
              PRTableData<DataOverviewItem>['data']
            >(
              (o, [key, value]) => ({
                ...o,
                [key]: {
                  variable: value,
                  ...res.data[key].overview,
                },
              }),
              {},
            ),
          },
          reviews: {
            structures: res.structure.reviews,
            data: Object.entries(res.variable).reduce<
              PRTableData<DataReviewItem>['data']
            >(
              (o, [key, value]) => ({
                ...o,
                [key]: {
                  variable: value,
                  ...res.data[key].reviews,
                },
              }),
              {},
            ),
          },
          comments: {
            structures: res.structure.comments,
            data: Object.entries(res.variable).reduce<
              PRTableData<DataReviewItem>['data']
            >(
              (o, [key, value]) => ({
                ...o,
                [key]: {
                  variable: value,
                  ...res.data[key].comments,
                },
              }),
              {},
            ),
          },
          rawData: res,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [peerReview.name]);

  const changeStatus = React.useCallback(
    (prNewStatus: PeerReviewStateSelector) => {
      PeerReviewDescriptorAPI.setStateUnmanaged(
        GameModel.selectCurrent().id!,
        peerReview.id!,
        Game.selectCurrent().id!,
        prNewStatus,
      )
        .catch(e => {
          e.json().then((error: WegasErrorMessage) => {
            popupDispatch(
              addPopup(
                error.message + new Date().getTime(),
                createTranslatableContent(lang, error.message),
                5000,
              ),
            );
          });
        })
        .finally(getData);
    },
    [getData, lang, peerReview.id],
  );

  React.useEffect(() => {
    getData();
  }, [getData]);

  const status = globalPRStatus(data?.overview.data);

  const showOverlay = React.useCallback(
    (
      title: string,
      content: string,
      button: React.RefObject<HTMLButtonElement>,
    ) => {
      setLayoutState({ title, content, button, show: true });
    },
    [],
  );

  return (
    <div className={cx(expandWidth, defaultMarginTop)}>
      <Toolbar className={expandWidth}>
        <Toolbar.Header className={css({ justifyContent: 'flex-end' })}>
          <Button icon="undo" onClick={getData} />
        </Toolbar.Header>
        <Toolbar.Content>
          <Toolbar className={expandWidth}>
            <Toolbar.Header
              className={cx(expandWidth, flex, flexColumn, stateBarStyle)}
            >
              <h2>
                {i18nValues.orchestrator.mainTitle(
                  translate(spr.getLabel(), lang),
                )}
              </h2>
              <div className={cx(flex, expandWidth, autoScroll)}>
                <div
                  className={cx(
                    flex,
                    grow,
                    flexRow,
                    showOverflow,
                    css({ padding: '1em' }),
                  )}
                >
                  <div
                    className={cx(prStateStyle, {
                      [prActiveStateStyle]: status === 'NOT_STARTED',
                    })}
                  >
                    <h3>{i18nValues.orchestrator.state.edition.title}</h3>
                    <p>{i18nValues.orchestrator.state.edition.description}</p>
                    <p style={{ fontStyle: 'italic' }}>
                      {i18nValues.orchestrator.state.edition.subDescription}{' '}
                    </p>
                  </div>
                  <Button
                    icon="arrow-right"
                    disabled={status !== 'NOT_STARTED'}
                    onClick={() => changeStatus('Dispatch')}
                  />
                  <div
                    className={cx(prStateStyle, {
                      [prActiveStateStyle]: status === 'REVIEWING',
                    })}
                  >
                    <h3>{i18nValues.orchestrator.state.reviewing.title}</h3>
                    <p>{i18nValues.orchestrator.state.reviewing.description}</p>
                    <p style={{ fontStyle: 'italic' }}>
                      {i18nValues.orchestrator.state.reviewing.subDescription}
                    </p>
                  </div>
                  <Button
                    icon="arrow-right"
                    disabled={status !== 'REVIEWING'}
                    onClick={() => changeStatus('Notify')}
                  />
                  <div
                    className={cx(prStateStyle, {
                      [prActiveStateStyle]: status === 'COMMENTING',
                    })}
                  >
                    <h3>{i18nValues.orchestrator.state.commenting.title}</h3>
                    <p>
                      {i18nValues.orchestrator.state.commenting.description}
                    </p>
                    <p style={{ fontStyle: 'italic' }}>
                      {i18nValues.orchestrator.state.commenting.subDescription}
                    </p>
                  </div>
                  <Button
                    icon="arrow-right"
                    disabled={status !== 'COMMENTING'}
                    onClick={() => changeStatus('Close')}
                  />
                  <div
                    className={cx(prStateStyle, {
                      [prActiveStateStyle]: status === 'CLOSED',
                    })}
                  >
                    <h3>{i18nValues.orchestrator.state.completed.title}</h3>
                    <p>{i18nValues.orchestrator.state.completed.description}</p>
                    <p style={{ fontStyle: 'italic' }}>
                      {i18nValues.orchestrator.state.completed.subDescription}
                    </p>
                  </div>
                </div>
              </div>
            </Toolbar.Header>
            <Toolbar.Content
              className={cx(flex, flexColumn, css({ marginTop: '40px' }))}
            >
              <h2>{i18nValues.orchestrator.properties}</h2>
              <div className={cx(flex, flexRow, itemCenter)}>
                <CheckBox
                  value={peerReview.includeEvicted}
                  onChange={value => {
                    const newPR: IPeerReviewDescriptor = {
                      ...peerReview,
                      includeEvicted: value,
                    };
                    store.dispatch(updateDescriptor(newPR));
                  }}
                  disabled={status !== 'NOT_STARTED'}
                />
                <div>{i18nValues.orchestrator.includeEvicted} </div>
              </div>
              {data != null && (
                <>
                  <h2>{i18nValues.orchestrator.overview}</h2>
                  <PRTable {...data.overview} onShowOverlay={showOverlay} />
                  <h2>{i18nValues.orchestrator.reviews}</h2>
                  <PRTable {...data.reviews} onShowOverlay={showOverlay} />
                  <h2>{i18nValues.orchestrator.comments}</h2>
                  <PRTable {...data.comments} onShowOverlay={showOverlay} />
                  <div>
                    <PRChart completeData={data.rawData} />
                  </div>
                </>
              )}
            </Toolbar.Content>
          </Toolbar>
        </Toolbar.Content>
      </Toolbar>

      {layoutState.show !== false && (
        <InfoOverlay
          title={layoutState.title}
          content={layoutState.content}
          onExit={() => {
            setLayoutState(oldState => ({ ...oldState, show: false }));
          }}
          attachedToRef={layoutState.button}
        />
      )}
    </div>
  );
}
