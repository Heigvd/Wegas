import { cx } from 'emotion';
import * as React from 'react';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { flex, flexColumn } from '../../../css/classes';
import JSONForm from 'jsoninput';
import { OverviewItem, OverviewState } from '../Overview';

export interface FilterState {
  [subColumnId: string]: { [columnId: string]: boolean };
}

export interface FilterModalContentProps {
  overviewState: OverviewState | undefined;
  filterState: FilterState | undefined;
  onNewFilterState: (newFilterState: FilterState) => void;
}

export function FilterModalContent({
  overviewState,
  filterState,
  onNewFilterState,
}: FilterModalContentProps) {
  const filterSchema = {
    description: 'Filter',
    properties: overviewState?.header.reduce(
      (o, r) => ({
        ...o,
        [r.id]: schemaProps.object({
          label: r.title,
          properties: (r.items as OverviewItem[]).reduce(
            (o, i) => ({
              ...o,
              [i.id]: schemaProps.boolean({
                label: i.label,
                layout: 'flexInline',
              }),
            }),
            {},
          ),
        }),
      }),
      {},
    ),
  };

  // schemaProps.boolean({ label: r.label })

  return (
    <div className={cx(flex, flexColumn)}>
      <h2>Filter columns</h2>
      <JSONForm
        value={
          filterState ||
          overviewState?.header.reduce(
            (o, r) => ({
              ...o,
              [r.id]: (r.items as OverviewItem[]).reduce(
                (o, i) => ({ ...o, [i.id]: true }),
                {},
              ),
            }),
            {},
          )
        }
        schema={filterSchema}
        onChange={onNewFilterState}
      />
    </div>
  );
}
