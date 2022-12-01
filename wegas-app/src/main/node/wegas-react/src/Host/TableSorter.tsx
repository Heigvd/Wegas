import { cx } from '@emotion/css';
import * as React from 'react';
import { Button } from '../Components/Inputs/Buttons/Button';
import { flex, flexRow, contentCenter } from '../css/classes';
import { Icons } from '../Editor/Components/Views/FontAwesome';

export type SortMode = 'NONE' | 'ASC' | 'DESC';

export interface SortState {
  sortedValue: string;
  sortMode: SortMode;
}

interface SorterProps {
  sortMode: SortMode | undefined;
  onClickSort: (newMode: SortMode) => void;
}

export function TableSorter({
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

export function sortFnFactory(sortState: SortState | undefined) {
  return function (a: any, b: any) {
    if (sortState == null) {
      return 0;
    } else {
      let itemA = a;
      let itemB = b;
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
  };
}
