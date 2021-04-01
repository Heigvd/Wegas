import { css } from 'emotion';
import * as React from 'react';
import { themeVar } from '../../Components/Style/ThemeVars';
import { store } from '../../data/Stores/store';
import { trainerCellStyleI } from '../Overview/Overview';
import { TeamTD, OverviewTD, ReviewTD } from './PeerReviewCells';
import {
  DataItem,
  DataOverviewItem,
  PRTableData,
  StructureItem,
} from './PeerReviewPage';

const PRTableStyle = css({
  borderCollapse: 'separate',
  borderSpacing: '10px',
  fontSize: '14px',
  'td, th': {
    ...trainerCellStyleI,
  },
  'thead th, thead td': {
    backgroundColor: themeVar.Common.colors.HighlightColor,
    fontSize: '16px',
  },
});

function isOverviewItem(item: DataItem): item is DataOverviewItem {
  return 'status' in item && 'commented' in item;
}

interface StructureItemWithTitle extends StructureItem {
  title: string;
}

interface PRTableProps extends PRTableData {
  onShowOverlay: (
    title: string,
    content: string,
    button: React.RefObject<HTMLButtonElement>,
  ) => void;
}

export function PRTable({ structures, data, onShowOverlay }: PRTableProps) {
  const items = structures.reduce(
    (o, s) => [
      ...o,
      ...s.items.map<StructureItemWithTitle>(i => ({ ...i, title: s.title })),
    ],
    [],
  );

  return (
    <table className={PRTableStyle}>
      <colgroup>
        <col />
      </colgroup>
      {structures.map(s => (
        <colgroup key={s.id + 'COLGROUP'}>
          <col span={s.items.length} />
        </colgroup>
      ))}

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
            <TeamTD
              teamName={store.getState().teams[key]?.name}
              value={value.variable}
              onShowOverlay={onShowOverlay}
            />
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
                  title={i.title}
                  data={value}
                  formatter={i.formatter}
                  onShowOverlay={onShowOverlay}
                />
              ))
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
