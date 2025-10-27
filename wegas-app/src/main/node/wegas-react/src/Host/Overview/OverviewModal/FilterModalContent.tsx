import {css, cx} from '@emotion/css';
import JSONForm from 'jsoninput';
import * as React from 'react';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import {autoScroll, expandBoth, flex, flexColumn, noMargin} from '../../../css/classes';
import { AvailableSchemas } from '../../../Editor/Components/FormView';
import { OverviewItem, OverviewState } from '../Overview';
import {themeVar} from "../../../Components/Theme/ThemeVars";

const titleStyle = css({
    color: themeVar.colors.PrimaryColor,
});

const filterListContainerStyle = css ({
    gap: '15px',
    'div': {
        margin: '0',
    }
});

const filterListStyle = css({
    width: '100%',
    height: '100%',
    'fieldset':  {
        width: '90%',
        border: 'none',
        marginBottom: '25px',
    },
    'legend':  {
        padding: '0',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'left',
        color: themeVar.colors.DarkTextColor,
    },
    'label': {
        width: '100%',
        margin: '0',
        padding: '10px 0',
        fontSize: '12px',
        fontWeight: 'bold',
        color: themeVar.colors.DarkTextColor,
        borderBottom: '1px solid',
        borderColor: themeVar.colors.DarkTextColor,
        opacity: '50%',
    },
    'button': {
        position: 'absolute',
        top: '50%',
        right: '0',
        transform: 'translate(0, -50%)',
        padding: '0',
    },
});

export interface FilterState {
  [subColumnId: string]: { [columnId: string]: boolean };
}

export interface FilterModalContentProps {
  overviewState: OverviewState | undefined;
  filterState: FilterState | undefined;
  onNewFilterState: (newFilterState: FilterState) => void;
  filterButtons?: () => JSX.Element;
}

type Schema = Record<string, AvailableSchemas>;

export function FilterModalContent({
  overviewState,
  filterState,
  onNewFilterState,
  filterButtons,
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
      <div className={cx(flex, flexColumn, expandBoth, filterListContainerStyle)}>
          <h2 className={cx(noMargin, titleStyle)}>Filter columns</h2>
          <div className={cx(autoScroll, filterListStyle)}>
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
              {filterButtons && filterButtons()}
          </div>
          );
          }
