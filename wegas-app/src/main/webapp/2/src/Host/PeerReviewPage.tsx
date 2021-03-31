import { css, cx } from 'emotion';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api';
import { VariableDescriptorAPI } from '../API/variableDescriptor.api';
import { languagesCTX } from '../Components/Contexts/LanguagesProvider';
import { globals } from '../Components/Hooks/useScript';
import { Button } from '../Components/Inputs/Buttons/Button';
import { themeVar } from '../Components/Style/ThemeVars';
import { Toolbar } from '../Components/Toolbar';
import {
  expandWidth,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
} from '../css/classes';
import { instantiate } from '../data/scriptable';
import { GameModel, Player } from '../data/selectors';
import { store, useStore } from '../data/Stores/store';
import { translate } from '../Editor/Components/FormView/translatable';
import { createScript } from '../Helper/wegasEntites';
import { wlog } from '../Helper/wegaslog';
import { InfoOverlay } from './InfoOverlay';

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
// TODO use exported style from overview
const PRTableStyle = css({
  borderCollapse: 'separate',
  borderSpacing: '10px',
  margin: '40px 0',
  fontSize: '14px',
  colgroup: {
    borderLeft: 'solid 15px transparent',
    borderRight: 'solid 15px transparent',
  },
  td: {
    minWidth: '60px',
    backgroundColor: '#fff',
    boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.1)',
    padding: '10px 15px',
    textAlign: 'center',
    margin: '3px',
    height: '48px',
  },
  'thead tr': {
    height: '25px',
    th: {
      boxShadow: 'none',
      verticalAlign: 'top',
      padding: '0 10px',
      textAlign: 'center',
    },
  },
});

function isOverviewItem(item: DataItem): item is DataOverviewItem {
  return true;
}

interface PeerReviewPageProps {
  peerReview: IPeerReviewDescriptor;
}

type DataOverviewItem = OverviewItem & {
  variable: string;
};

interface DataReviewItem {
  [id: string]: ReviewsItemValue;
  variable: string;
}

type DataItem = DataOverviewItem | DataReviewItem;

interface PRTableProps {
  structures: TableStructure[];
  data: {
    [id: string]: DataItem;
  };
}

interface OverviewTDProps {
  value: string;
  color: OverviewColor;
}

function OverviewTD({ value, color }: OverviewTDProps) {
  // TODO : switch-case colors
  return <td style={{ backgroundColor: color }}>{value}</td>;
}

interface OldStyleOverviewTDProps {
  value: string | undefined;
  data: DataOverviewItem;
  nodeFormatter: string | undefined;
  formatter: string;
}

function OldStyleOverviewTD({
  value,
  data,
  nodeFormatter,
  formatter,
}: OldStyleOverviewTDProps) {
  let formattedvalue = value;
  try {
    //... at that point, it's just insanity.
    // Why would anyone give such a complex and clunky object to do just that...
    const maybenullvalue = globals.Function('o', formatter)({ value, data });
    if (maybenullvalue != null) {
      formattedvalue = maybenullvalue;
    }
    if (nodeFormatter) {
      formattedvalue = globals.Function(
        'o',
        nodeFormatter,
      )({ value: formattedvalue, data });
    }
  } catch (_e) {
    // common... why would you do a function that is not a function?
    // I guess it was still too easy...
    formattedvalue = formatter;
  }

  return (
    <td>
      <div dangerouslySetInnerHTML={{ __html: String(formattedvalue) }} />
    </td>
  );
}

interface ReviewTDProps {
  value: string;
  color: OverviewColor;
}

function ReviewTD({ value, color }: OverviewTDProps) {
  return <td style={{ backgroundColor: color }}> {value}</td>;
}

function PRTable({ structures, data }: PRTableProps) {
  const items = structures.reduce((o, s) => [...o, ...s.items], []);

  return (
    <table className={PRTableStyle}>
      <thead>
        <tr>
          <th rowSpan={2}>Equipe</th>
          {structures.map(s => (
            <th key={s.id} colSpan={s.items.length}>
              {s.title}
            </th>
          ))}
        </tr>
        <tr>
          {structures.map(s =>
            s.items.map(i => <td key={JSON.stringify(i)}>{i.label}</td>),
          )}
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr key={key}>
            <td>
              {store.getState().teams[key].name}
              <Button icon="info-circle" onClick={() => wlog(value.variable)} />
            </td>
            {isOverviewItem(value) ? (
              items.map(i => (
                <OldStyleOverviewTD
                  key={JSON.stringify(i)}
                  value={value[i.id as keyof DataOverviewItem]}
                  data={value}
                  formatter={i.formatter}
                  nodeFormatter={i.nodeFormatter}
                />
              ))
            ) : (
              <td>{JSON.stringify(value)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface StructureItem {
  id: string;
  label: string;
  formatter: string;
  nodeFormatter?: string;
  allowHTML?: boolean;
}

type OverviewColor = 'green' | 'orange' | 'red' | 'grey' | undefined;

interface OverviewItem {
  done: string;
  done_color: OverviewColor;
  commented: string;
  comments_color?: OverviewColor;
  color: OverviewColor;
  internal_status: string;
  status: string;
}

interface TableStructure {
  id?: string;
  title: string;
  items: StructureItem[];
}

type ReviewsItemValue = string | number | (number | null)[] | (string | null)[];

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
    [id: string]:
      | {
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
        }
      | number;
  };
  variable: {
    [id: string]: string;
  };
}

interface IData {
  overview: PRTableProps;
  reviews: PRTableProps;
  comments: PRTableProps;
}

//add content in the State
interface LayoutState {
  show: boolean;
  content: string;
}

const defaultLayoutState: LayoutState = {
  show: false,
  content: 'No content',
};

export default function PeerReviewPage({ peerReview }: PeerReviewPageProps) {
  const [layoutState, setLayoutState] = React.useState<LayoutState>(
    defaultLayoutState,
  );

  const { lang } = React.useContext(languagesCTX);
  const [data, setData] = React.useState<IData>();
  const spr = useStore(() => instantiate(peerReview));
  const self = Player.self();
  const state = spr.getState(self) as
    | 'DISCARDED'
    | 'EVICTED'
    | 'NOT_STARTED'
    | 'SUBMITTED'
    | 'DISPATCHED'
    | 'NOTIFIED'
    | 'COMPLETED';

  React.useEffect(() => {
    let mounted = true;
    VariableDescriptorAPI.runScript(
      GameModel.selectCurrent().id!,
      Player.selectCurrent().id!,
      createScript(`ReviewHelper.summarize("${peerReview.name}")`),
      undefined,
      true,
    ).then((res: PeerReviewData) => {
      if (mounted) {
        setData({
          overview: {
            structures: res.structure.overview,
            data: Object.entries(res.variable).reduce<PRTableProps['data']>(
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
            data: Object.entries(res.variable).reduce<PRTableProps['data']>(
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
            data: Object.entries(res.variable).reduce<PRTableProps['data']>(
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
  const overlayButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className={expandWidth}>
      <Toolbar>
        <Toolbar.Header className={cx(flex, flexColumn)}>
          <h2>Peer Review Process for "{translate(spr.getLabel(), lang)}"</h2>
          <div className={cx(flex, flexRow, flexDistribute, expandWidth)}>
            <div
              className={cx(prStateStyle, {
                [prActiveStateStyle]: state === 'NOT_STARTED',
              })}
            >
              <h3>Edition</h3>
              <p>The authors are editing what will be reviewed</p>
              <p style={{ fontStyle: 'italic' }}>
                The process has not begun yet
              </p>
            </div>
            <Button icon="arrow-right" disabled={state !== 'NOT_STARTED'} />
            <div className={prStateStyle}>
              <h3>Reviewing</h3>
              <p>The authors are reviewing their peers</p>
              <p style={{ fontStyle: 'italic' }}>
                This is the first step of the process
              </p>
            </div>
            <Button icon="arrow-right" />
            <div className={prStateStyle}>
              <h3>Commenting</h3>
              <p>The authors acquaint themselves with peer reviews</p>
              <p style={{ fontStyle: 'italic' }}>
                They comment on those reviews
              </p>
            </div>
            <Button icon="arrow-right" />
            <div className={prStateStyle}>
              <h3>Completed</h3>
              <p>The reviewing process has been completed</p>
              <p style={{ fontStyle: 'italic' }}>
                The authors take acquaintance of comments on reviews they've
                done
              </p>
            </div>
          </div>
        </Toolbar.Header>
        <Button
        // TODO apply that to icons in TDs
          icon="undo"
          onClick={e => {
            e.stopPropagation();
            setLayoutState(oldState => ({ ...oldState, show: true }));
          }}
          className={css({ width: '200px', marginTop: '40px' })}
          ref={overlayButtonRef}
        >
          INFO OVERLAY TESTER
        </Button>
        <Toolbar.Content className={cx(flex, flexColumn)}>
          {data != null && (
            <>
              <PRTable {...data.overview} />
              <PRTable {...data.reviews} />
              <PRTable {...data.comments} />
            </>
          )}
        </Toolbar.Content>
      </Toolbar>
      {layoutState.show !== false && (
        <InfoOverlay
          content={
            '<div><h3>HOLAAAAAA</h3><p> This is the content of the Info overlay (no worry, just for test)!!!!</p></div>'
          }
          onExit={() => {
            setLayoutState(oldState => ({ ...oldState, show: false }));
          }}
          attachedToRef={overlayButtonRef}
        />
      )}
    </div>
  );
}
