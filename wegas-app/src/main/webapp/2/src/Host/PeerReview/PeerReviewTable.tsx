import { css } from 'emotion';
import * as React from 'react';
import { themeVar } from '../../Components/Style/ThemeVars';
import { store } from '../../data/Stores/store';
import { trainerCellStyleI } from '../Overview/Overview';
import { sortFnFactory, SortState, TableSorter } from '../TableSorter';
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
  'td, th': trainerCellStyleI,
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

interface PRTableProps extends PRTableData<DataItem> {
  onShowOverlay: (
    title: string,
    content: string,
    button: React.RefObject<HTMLButtonElement>,
  ) => void;
}

export function PRTable({ structures, data, onShowOverlay }: PRTableProps) {
  const [sortState, setSortState] = React.useState<SortState>();

  const sortFn = React.useCallback(
    (a: [string, DataItem], b: [string, DataItem]) => {
      const newA =
        sortState?.sortedValue === 'team'
          ? store.getState().teams[a[0]]?.name
          : a[1][sortState?.sortedValue as keyof typeof a[1]];
      const newB =
        sortState?.sortedValue === 'team'
          ? store.getState().teams[b[0]]?.name
          : b[1][sortState?.sortedValue as keyof typeof b[1]];
      return sortFnFactory(sortState)(newA, newB);
    },
    [sortState],
  );

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
          <th rowSpan={2}>
            <TableSorter
              sortMode={
                sortState?.sortedValue === 'team' ? sortState.sortMode : 'NONE'
              }
              onClickSort={newMode =>
                setSortState({ sortedValue: 'team', sortMode: newMode })
              }
            >
              Equipe
            </TableSorter>
          </th>
          {structures.map(s => (
            <th key={s.id} colSpan={s.items.length}>
              {s.title}
            </th>
          ))}
        </tr>
        <tr>
          {structures.map(s =>
            s.items.map(i => (
              <td key={JSON.stringify(i)}>
                <TableSorter
                  sortMode={
                    sortState?.sortedValue === i.id
                      ? sortState.sortMode
                      : 'NONE'
                  }
                  onClickSort={newMode =>
                    setSortState({ sortedValue: i.id, sortMode: newMode })
                  }
                >
                  {i.label}
                </TableSorter>
              </td>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {Object.entries(data)
          .sort(sortFn)
          .map(([key, value]) => (
            <tr key={key}>
              <TeamTD
                team={store.getState().teams[key]}
                value={value.variable}
                onShowOverlay={onShowOverlay}
              />
              {isOverviewItem(value) ? (
                <>
                  <OverviewTD value={value.status} color={value.color} />
                  <OverviewTD value={value.done} color={value.done_color} />
                  <OverviewTD
                    value={value.commented}
                    color={value.comments_color}
                  />
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
