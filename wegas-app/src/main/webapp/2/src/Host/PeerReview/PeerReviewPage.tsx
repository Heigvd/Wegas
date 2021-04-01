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
  expandWidth,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
} from '../../css/classes';
import {
  setPRState,
  updateDescriptor,
} from '../../data/Reducer/VariableDescriptorReducer';
import { instantiate } from '../../data/scriptable';
import { Game, GameModel, Player } from '../../data/selectors';
import { store, useStore } from '../../data/Stores/store';
import { translate } from '../../Editor/Components/FormView/translatable';
import { createScript } from '../../Helper/wegasEntites';
import { InfoOverlay } from '../InfoOverlay';
import { PRTable } from './PeerReviewTable';
// import { testPRData } from './PRinterfaceTests';

const prStateStyle = css({
  borderRadius: '10px',
  backgroundColor: themeVar.Common.colors.PrimaryColor,
  color: themeVar.Common.colors.SecondaryBackgroundColor,
  boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.2)',
  padding: '10px',
  minWidth: '200px',
  minHeight: '120px',
  textAlign: 'center',
});

const prActiveStateStyle = css({
  backgroundColor: themeVar.Common.colors.ActiveColor,
  color: themeVar.Common.colors.LightTextColor,
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
  extra: {
    [id: number]: {
      numberOfValues: number;
      mean?: number | null;
      min?: number | null;
      max?: number | null;
      median?: number | null;
      sd?: number | null;
      histogram?:
        | {
            min: number;
            max: number;
            maxValue: number | null;
            minValue: number | null;
            count: number;
          }[]
        | {
            [label: string]: number;
          };
      type: string;
      id: number;
      name: string;
      label: string;
      data: [];
      averageNumberOfWords?: number;
      averageNumberOfCharacters?: number;
    };
    maxNumberOfValue: number;
  };
  variable: {
    [id: string]: string;
  };
}

interface IData {
  overview: PRTableData<DataOverviewItem>;
  reviews: PRTableData<DataReviewItem>;
  comments: PRTableData<DataReviewItem>;
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

  React.useEffect(() => {
    let mounted = true;
    VariableDescriptorAPI.runScript(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      createScript(`ReviewHelper.summarize("${peerReview.name}")`),
      undefined,
      true,
    ).then((res: PeerReviewData) => {
      // Test purposes
      // const res = testPRData;

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
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [peerReview.name]);

  const status = globalPRStatus(data?.overview.data);

  const overlayButtonRef = React.useRef<HTMLButtonElement>(null);

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
    <div className={expandWidth}>
      <Toolbar>
        <Toolbar.Header className={cx(flex, flexColumn)}>
          <h2>Peer Review Process for "{translate(spr.getLabel(), lang)}"</h2>
          <div className={cx(flex, flexRow, flexDistribute, expandWidth)}>
            <div
              className={cx(prStateStyle, {
                [prActiveStateStyle]: status === 'NOT_STARTED',
              })}
            >
              <h3>Edition</h3>
              <p>The authors are editing what will be reviewed</p>
              <p style={{ fontStyle: 'italic' }}>
                The process has not begun yet
              </p>
            </div>
            <Button
              icon="arrow-right"
              disabled={status !== 'NOT_STARTED'}
              onClick={() =>
                store.dispatch(setPRState(peerReview.id!, 'Dispatch'))
              }
            />
            <div
              className={cx(prStateStyle, {
                [prActiveStateStyle]: status === 'REVIEWING',
              })}
            >
              <h3>Reviewing</h3>
              <p>The authors are reviewing their peers</p>
              <p style={{ fontStyle: 'italic' }}>
                This is the first step of the process
              </p>
            </div>
            <Button
              icon="arrow-right"
              disabled={status !== 'REVIEWING'}
              onClick={() =>
                store.dispatch(setPRState(peerReview.id!, 'Notify'))
              }
            />
            <div
              className={cx(prStateStyle, {
                [prActiveStateStyle]: status === 'COMMENTING',
              })}
            >
              <h3>Commenting</h3>
              <p>The authors acquaint themselves with peer reviews</p>
              <p style={{ fontStyle: 'italic' }}>
                They comment on those reviews
              </p>
            </div>
            <Button
              icon="arrow-right"
              disabled={status !== 'COMMENTING'}
              onClick={() =>
                store.dispatch(setPRState(peerReview.id!, 'Close'))
              }
            />
            <div
              className={cx(prStateStyle, {
                [prActiveStateStyle]: status === 'CLOSED',
              })}
            >
              <h3>Completed</h3>
              <p>The reviewing process has been completed</p>
              <p style={{ fontStyle: 'italic' }}>
                The authors take acquaintance of comments on reviews they've
                done
              </p>
            </div>
          </div>
        </Toolbar.Header>
        <Toolbar.Content className={cx(flex, flexColumn)}>
          <h2>TEST</h2>
          <Button
            ref={overlayButtonRef}
            icon="undo"
            onClick={e => {
              e.stopPropagation();
              setLayoutState(oldState => ({
                ...oldState,
                button: overlayButtonRef,
                show: true,
              }));
            }}
            className={css({ width: '200px', marginTop: '40px' })}
          >
            INFO OVERLAY TESTER
          </Button>
          <h2>Properties</h2>
          <div className={cx(flex, flexRow)}>
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
            <div>
              Authors who did not submit anything for review shall still receive
              something to review
            </div>
          </div>
          {data != null && (
            <>
              <h2>Overview</h2>
              <PRTable {...data.overview} onShowOverlay={showOverlay} />
              <h2>Reviews</h2>
              <PRTable {...data.reviews} onShowOverlay={showOverlay} />
              <h2>Comments</h2>
              <PRTable {...data.comments} onShowOverlay={showOverlay} />
            </>
          )}
          <h2>Chart reviews</h2>
          <h2>Chart comments</h2>
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
