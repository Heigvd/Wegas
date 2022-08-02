import { cx } from '@emotion/css';
import JSONForm from 'jsoninput';
import * as React from 'react';
import { AvailableSchemas } from '../../../Components/FormView';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { flex, flexColumn } from '../../../css/classes';
import { OverviewItem, OverviewState } from '../Overview';

export interface FilterState {
  [subColumnId: string]: { [columnId: string]: boolean };
}

export interface FilterModalContentProps {
  overviewState: OverviewState | undefined;
  filterState: FilterState | undefined;
  onNewFilterState: (newFilterState: FilterState) => void;
}

type Schema = Record<string, AvailableSchemas>;

export function FilterModalContent({
  overviewState,
  filterState,
  onNewFilterState,
}: FilterModalContentProps) {
  const filterSchema = {
    description: 'Filter',
    properties: overviewState?.header.reduce<Schema>(
      (groupProperties, group) => {
        groupProperties[group.id] = schemaProps.object({
          label: group.title || group.id,
          properties: (group.items as OverviewItem[]).reduce<Schema>(
            (properties, item) => {
              properties[item.id] = schemaProps.boolean({
                label: item.label || item.id,
                layout: 'flexInline',
              });
              return properties;
            },
            {},
          ),
        });
        return groupProperties;
      },
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
          overviewState?.header.reduce<Record<string, Record<string, boolean>>>(
            (groups, group) => {
              groups[group.id] = (group.items as OverviewItem[]).reduce<
                Record<string, boolean>
              >((items, item) => {
                items[item.id] = true;
                return items;
              }, {});
              return groups;
            },
            {},
          )
        }
        schema={filterSchema}
        onChange={onNewFilterState}
      />
    </div>
  );
}
