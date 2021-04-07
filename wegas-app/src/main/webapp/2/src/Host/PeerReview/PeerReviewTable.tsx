import { css, cx } from 'emotion';
import * as React from 'react';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../Components/Style/ThemeVars';
import { contentCenter, flex, flexRow } from '../../css/classes';
import { store } from '../../data/Stores/store';
import { Icons } from '../../Editor/Components/Views/FontAwesome';
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

type SortMode = 'NONE' | 'ASC' | 'DESC';

interface SorterProps {
  sortMode: SortMode | undefined;
  onClickSort: (newMode: SortMode) => void;
}

function Sorter({
  sortMode,
  onClickSort,
  children,
}: React.PropsWithChildren<SorterProps>) {
  let icon: Icons = 'sort';
  let newMode: SortMode = 'NONE';
  switch (sortMode) {
    case 'ASC': {
      icon = 'caret-up';
      newMode = 'DESC';
      break;
    }
    case 'DESC': {
      icon = 'caret-down';
      newMode = 'NONE';
      break;
    }
    case 'NONE':
    default: {
      icon = 'sort';
      newMode = 'ASC';
      break;
    }
  }

  return (
    <div className={cx(flex, flexRow, contentCenter)}>
      {children}
      <Button icon={icon} onClick={() => onClickSort(newMode)} />
    </div>
  );
}

interface PRTableProps extends PRTableData<DataItem> {
  onShowOverlay: (
    title: string,
    content: string,
    button: React.RefObject<HTMLButtonElement>,
  ) => void;
}

export function PRTable({ structures, data, onShowOverlay }: PRTableProps) {
  const [sortState, setSortState] = React.useState<{
    sortedValue: string;
    sortMode: SortMode;
  }>();

  const sortFn = React.useCallback(
    (a: [string, DataItem], b: [string, DataItem]) => {
      if (sortState == null) {
        return 0;
      } else {
        let itemA =
          sortState.sortedValue === 'team'
            ? store.getState().teams[a[0]]?.name
            : a[1][sortState.sortedValue as keyof typeof a[1]];
        let itemB =
          sortState.sortedValue === 'team'
            ? store.getState().teams[b[0]]?.name
            : b[1][sortState.sortedValue as keyof typeof b[1]];

        // Removing accents for sorting
        if (typeof itemA === 'string') {
          itemA = itemA.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        if (typeof itemB === 'string') {
          itemB = itemB.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        if (
          sortState.sortMode === 'NONE' ||
          itemA == null ||
          itemB == null ||
          itemA === itemB
        ) {
          return 0;
        }
        if (itemA < itemB) {
          if (sortState.sortMode === 'ASC') {
            return -1;
          } else {
            return 1;
          }
        } else if (itemA > itemB) {
          if (sortState.sortMode === 'ASC') {
            return 1;
          } else {
            return -1;
          }
        }
        return 0;
      }
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
            <Sorter
              sortMode={
                sortState?.sortedValue === 'team' ? sortState.sortMode : 'NONE'
              }
              onClickSort={newMode =>
                setSortState({ sortedValue: 'team', sortMode: newMode })
              }
            >
              Equipe
            </Sorter>
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
                <Sorter
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
                </Sorter>
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
