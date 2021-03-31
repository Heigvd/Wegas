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
  itemCenter,
  justifyCenter,
} from '../css/classes';
import { instantiate } from '../data/scriptable';
import { GameModel, Player } from '../data/selectors';
import { store, useStore } from '../data/Stores/store';
import { translate } from '../Editor/Components/FormView/translatable';
import { createScript } from '../Helper/wegasEntites';
import { wlog } from '../Helper/wegaslog';
import { testPRData } from './Overview/PRinterfaceTests';

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

function isOverviewItem(item: DataItem): item is DataOverviewItem {
  return 'status' in item && 'commented' in item;
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
  value: string | undefined;
  color: OverviewColor;
}

function OverviewTD({ value, color }: OverviewTDProps) {
  // TODO : switch-case colors
  return <td style={{ backgroundColor: color }}>{value}</td>;
}

function normalizeFormatterFunction(
  stringFn: string,
): { found: true; fn: string } | { found: false; fn: string | null } {
  const regex = new RegExp(/(function )([a-zA-Z0-9_]*)( *)(\([a-zA-Z0-9_]*\))/);
  const found = regex.exec(stringFn);
  if (found != null) {
    return { found: true, fn: stringFn + 'return ' + found[2] + found[4] };
  } else {
    if (stringFn === 'null') {
      return { found: false, fn: null };
    } else {
      return { found: false, fn: stringFn };
    }
  }
}

interface ReviewTDProps {
  value: ReviewsItemValue;
  data: DataReviewItem;
  formatter: string | undefined;
}

function ReviewTD({ value, data, formatter }: ReviewTDProps) {
  let buttonData: ReviewsItemValue | undefined = undefined;
  let formattedValue = value;
  if (formatter != null) {
    const normalizedFormatter = normalizeFormatterFunction(formatter);
    if (normalizedFormatter.found) {
      formattedValue = globals.Function(
        'o',
        normalizedFormatter.fn,
      )({ value, data });
    } else if (normalizedFormatter.fn != null) {
      formattedValue = normalizedFormatter.fn.replace('{value}', String(value));

      // Parsing pattern like
      // <span class="gradeeval-data">{value} <i data-ref="19666598-data" class="fa fa-info-circle"></i></span>
      const regex = new RegExp(/(data-ref=")(\d*)(-)([a-zA-Z]*)(")/);
      const found = regex.exec(formattedValue);
      if (found != null) {
        buttonData = data[found[2] + found[3] + found[4]];
      }
    }
  }

  return (
    <td>
      <div className={cx(flex, flexRow, itemCenter, justifyCenter)}>
        <div dangerouslySetInnerHTML={{ __html: String(formattedValue) }} />
        {buttonData && (
          <Button icon="info-circle" onClick={() => wlog(buttonData)} />
        )}
      </div>
    </td>
  );
}

function PRTable({ structures, data }: PRTableProps) {
  const items = structures.reduce((o, s) => [...o, ...s.items], []);

  return (
    <table>
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
              {store.getState().teams[key]?.name}
              <Button icon="info-circle" onClick={() => wlog(value.variable)} />
            </td>
            {isOverviewItem(value) ? (
              <>
                <OverviewTD value={value.status} color={value.color} />
                <OverviewTD
                  value={value.commented}
                  color={value.comments_color}
                />
                <OverviewTD value={value.done} color={value.done_color} />
              </>
            ) : (
              items.map(i => (
                <ReviewTD
                  key={JSON.stringify(i) + i.id}
                  value={value[i.id]}
                  data={value}
                  formatter={i.formatter}
                />
              ))
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

export default function PeerReviewPage({ peerReview }: PeerReviewPageProps) {
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
    ).then((_res: PeerReviewData) => {
      // Test purposes
      const res = testPRData;
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
        <Toolbar.Content className={cx(flex, flexColumn)}>
          {data != null && (
            <>
              {/* <PRTable {...data.overview} /> */}
              <PRTable {...data.reviews} />
              <PRTable {...data.comments} />
            </>
          )}
        </Toolbar.Content>
      </Toolbar>
    </div>
  );
}
