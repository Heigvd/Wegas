import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  expandBoth,
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
  justifyCenter,
} from '../../css/classes';
import { entityIs } from '../../data/entities';
import { classNameOrEmpty, classOrNothing } from '../../Helper/className';
import { createScript } from '../../Helper/wegasEntites';
import { useScript } from '../Hooks/useScript';
import { schemaProps } from '../PageComponents/tools/schemaProps';
import { themeVar } from '../Theme/ThemeVars';

const menuLabelDefaultStyle = cx(
  flex,
  itemCenter,
  css({
    padding: '10px',
    cursor: 'pointer',
    backgroundColor: themeVar.colors.BackgroundColor,
    fontWeight: 600,
    color: themeVar.colors.DarkTextColor,
    transition: 'all .4s ease',
    '&.selected, &:hover': {
      backgroundColor: themeVar.colors.HeaderColor,
    },
    '&.readOnly': {
      color: themeVar.colors.DisabledColor,
      userSelect: 'none',
      pointerEvents: 'none',
    }
  }),
);

const menuBarStyle = cx(
  flex,
  css({
    borderBottom: '1px solid ' + themeVar.colors.DisabledColor,
    flexDirection: 'row',
    '&.vertical': {
      flexDirection: 'column',
      borderBottom: 'none',
      borderRight: '1px solid ' + themeVar.colors.DisabledColor,
    },
  }),
);

interface MenuChild {
  label: React.ReactNode | IScript;
  content: React.ReactNode;
  index?: number;
  readOnly?: boolean;
}

export type MenuChildren = {
  [id: string]: MenuChild;
};

export interface LabelFNArgs extends Omit<MenuChild, 'content'> {
  id: string;
  selected: boolean;
  onClick: () => void;
}

interface MenuLabelProps extends LabelFNArgs {
  labelFN?: (child: LabelFNArgs) => React.ReactNode;
  labelClassName?: string;
}

export function MenuLabel({
  onClick,
  selected,
  label,
  labelFN,
  labelClassName,
  id,
  index,
  readOnly,
}: MenuLabelProps) {
  const isScript = entityIs(label, 'Script');
  const labelScript = useScript(
    isScript ? (label as IScript) : createScript(''),
  );
  const labelValue = isScript ? labelScript : label;
  return (
    <div
      onClick={onClick}
      className={cx(
        classOrNothing('selected', selected),
        classOrNothing('readOnly', readOnly),
        labelClassName ? labelClassName : menuLabelDefaultStyle,
      )}
      title={String(labelValue)}
    >
      {labelFN
        ? labelFN({ id, index, label: labelValue, onClick, selected })
        : labelValue}
    </div>
  );
}

export interface MenuProps<T extends MenuChildren = MenuChildren>
  extends ClassStyleId {
  vertical?: boolean;
  items?: T;
  labelFN?: (child: LabelFNArgs) => React.ReactNode;
  labelClassName?: string;
}

export function Menu<T extends MenuChildren = MenuChildren>({
  vertical,
  items,
  labelFN,
  labelClassName,
  className,
  style,
  id,
}: MenuProps<T>) {
  const [selectedItem, setSelectedItem] = React.useState<keyof T | undefined>();

  return (
    <div
      className={
        cx(flex, vertical ? flexRow : flexColumn, grow, expandBoth) +
        classNameOrEmpty(className)
      }
      style={{
        ...style,
      }}
      id={id}
    >
      <div className={cx(classOrNothing('vertical', vertical), menuBarStyle)}>
        {Object.entries(items || [])
          .sort(([, a], [, b]) => (a.index || 0) - (b.index || 0))
          .map(([k, v]) => {
            function onClick() {
              setSelectedItem(k);
            }
            const selected = selectedItem === k;
            return (
              <MenuLabel
                key={k}
                onClick={onClick}
                selected={selected}
                label={v.label}
                id={k}
                index={v.index}
                labelFN={labelFN}
                labelClassName={labelClassName}
                readOnly={v.readOnly}
              />
            );
          })}
      </div>
      <div className={cx(flex, grow, itemCenter, justifyCenter)}>
        {items && selectedItem && items[selectedItem].content}
      </div>
    </div>
  );
}

export interface MenuItemProps {
  childrenComponentId: string;
  childrenComponentLabel: IScript;
  childrenComponentIndex?: number;
}

export const defaultMenuItemProps: MenuItemProps = {
  childrenComponentId: 'An id',
  childrenComponentLabel: createScript('A label', 'Typescript'),
  childrenComponentIndex: 0,
};

export const defaultMenuItemKeys = Object.keys(
  defaultMenuItemProps,
) as (keyof MenuItemProps)[];

export const menuItemSchema: { [prop: string]: SimpleSchemaProps } = {
  childrenComponentId: schemaProps.string({
    label: 'Component id',
    required: true,
  }),
  childrenComponentLabel: schemaProps.scriptString({
    label: 'Component label',
    required: true,
  }),
  childrenComponentIndex: schemaProps.number({ label: 'Component index' }),
};
