import { css, cx } from 'emotion';
import * as React from 'react';
import {
  ActionItem,
  isDataItem,
  OverviewClickType,
  OverviewItem,
  OverviewState,
} from './Overview';
import { firstScrollCellStyle, fixedCellStyle } from './OverviewCell';
import { OverviewButton } from './OverviewButton';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { flex, flexColumn, itemCenter, justifyCenter } from '../../css/classes';
import { themeVar } from '../../Components/Style/ThemeVars';
import { SortMode, SortState, TableSorter } from '../TableSorter';
import { FilterState } from './OverviewModal/FilterModalContent';

const headerStyle = css({
  verticalAlign: 'middle',
  textAlign: 'center',
});

const fixedHeaderCellStyle = cx(
  css({
    backgroundColor: themeVar.Common.colors.BackgroundColor,
    height: '25px',
  }),
  fixedCellStyle,
);

const iconApplyToAll = (
  <svg
    width="9"
    height="10"
    viewBox="0 0 9 10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.5452 5.16815C8.87421 5.49117 8.87906 6.01975 8.55603 6.34876L5.2166 9.75003C5.05962 9.90992 4.84495 10 4.62088 10C4.39681 10 4.18214 9.90992 4.02515 9.75003L0.685727 6.34876C0.362699 6.01975 0.367549 5.49117 0.696558 5.16815C1.02557 4.84512 1.55415 4.84997 1.87717 5.17898L3.78602 7.12318L3.78602 1.77141C3.78602 1.31033 4.1598 0.936554 4.62088 0.936554C5.08196 0.936554 5.45574 1.31033 5.45574 1.77141L5.45574 7.12318L7.36458 5.17898C7.68761 4.84997 8.21619 4.84512 8.5452 5.16815Z"
    />
  </svg>
);

function filterFn(item: OverviewItem, filterState: FilterState | undefined) {
  return (
    filterState == null ||
    Object.values(filterState).reduce((o, i) => ({ ...o, ...i }), {})[item.id]
  );
}

interface OverviewHeaderProps {
  overviewState: OverviewState | undefined;
  filterState: FilterState | undefined;
  onClick: (type: OverviewClickType, item?: ActionItem) => void;
  sortState: SortState | undefined;
  onClickSort: (value: string, mode: SortMode) => void;
}

export function OverviewHeader({
  overviewState,
  filterState,
  onClick,
  sortState,
  onClickSort,
}: OverviewHeaderProps) {
  return (
    <>
      <colgroup className="fixedColumn">
        <col />
      </colgroup>
      {!overviewState && (
        <colgroup>
          <col />
        </colgroup>
      )}
      {overviewState?.header &&
        overviewState.header.map((h, i) => (
          <colgroup key={h.title + i + 'col'}>
            <col
              span={
                (h.items as OverviewItem[]).filter(item =>
                  filterFn(item, filterState),
                ).length
              }
            />
          </colgroup>
        ))}
      <colgroup>
        <col span={2} />
      </colgroup>
      <thead className={headerStyle}>
        <tr>
          <th className={fixedHeaderCellStyle}>
            <TableSorter
              sortMode={
                sortState && sortState.sortedValue === 'team'
                  ? sortState.sortMode
                  : 'NONE'
              }
              onClickSort={newMode => onClickSort('team', newMode)}
            >
              Team
            </TableSorter>
          </th>
          {!overviewState && (
            <th rowSpan={2} className={firstScrollCellStyle}>
              Impact
            </th>
          )}
          {overviewState?.header &&
            overviewState.header.map((h, i) => (
              <th
                key={h.title + i}
                colSpan={
                  (h.items as OverviewItem[]).filter(item =>
                    filterFn(item, filterState),
                  ).length
                }
                className={cx({ [firstScrollCellStyle]: i === 0 })}
              >
                {h.title}
              </th>
            ))}
          <th colSpan={2}>Actions</th>
        </tr>
        <tr>
          <th className={fixedHeaderCellStyle}></th>
          {overviewState?.row
            .filter(item => filterFn(item, filterState))
            .map((r, i) => {
              if (isDataItem(r)) {
                const { id, label, sortable } = r;
                return (
                  <th
                    key={'header' + id}
                    className={cx({ [firstScrollCellStyle]: i === 0 })}
                  >
                    {sortable ? (
                      <TableSorter
                        sortMode={
                          sortState && sortState.sortedValue === id
                            ? sortState.sortMode
                            : 'NONE'
                        }
                        onClickSort={newMode => onClickSort(id, newMode)}
                      >
                        {label || id}
                      </TableSorter>
                    ) : (
                      label || id
                    )}
                  </th>
                );
              } else {
                const { id, label, hasGlobal } = r;
                return (
                  <th
                    key={'header' + id}
                    className={cx({ [firstScrollCellStyle]: i === 0 })}
                  >
                    {hasGlobal ? (
                      <div
                        className={cx(
                          flex,
                          flexColumn,
                          itemCenter,
                          justifyCenter,
                        )}
                      >
                        <OverviewButton
                          item={r}
                          className={css({ paddingBottom: 0 })}
                          onClick={onClick}
                        />
                        {iconApplyToAll}
                      </div>
                    ) : (
                      label
                    )}
                  </th>
                );
              }
            })}
          <th>
            <div className={cx(flex, flexColumn, itemCenter, justifyCenter)}>
              <Button
                icon="envelope"
                tooltip="send mail"
                className={css({ paddingBottom: 0 })}
                onClick={() => onClick('Mail')}
              />
              {iconApplyToAll}
            </div>
          </th>
          <th />
        </tr>
      </thead>
    </>
  );
}
