import * as React from 'react';
import { schemaProps } from '../PageComponents/tools/schemaProps';
import { css, cx } from 'emotion';
import { grid, grow } from '../../css/classes';
import { classNameOrEmpty } from '../../Helper/className';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';

export const justifySelfValues = ['start', 'end', 'center', 'stretch'] as const;
type JustifySelf = typeof justifySelfValues[number];

export interface GridItemLayoutProps {
  /**
   * gridColumnStart - Determines a grid item’s location within the grid
   */
  gridColumnStart?: string;
  /**
   * gridColumnEnd - Determines a grid item’s location within the grid
   */
  gridColumnEnd?: string;
  /**
   * gridRowStart - Determines a grid item’s location within the grid
   */
  gridRowStart?: string;
  /**
   * gridRowEnd - Determines a grid item’s location within the grid
   */
  gridRowEnd?: string;
  /**
   * gridAera - Gives an item a name so that it can be referenced by a template created with the grid-template-areas
   */
  gridAera?: string;
  /**
   * justifySelf - Aligns a grid item inside a cell along the inline (row) axis
   */
  justifySelf?: JustifySelf;
  /**
   * alignSelf - Aligns a grid item inside a cell along the block (column) axis
   */
  alignSelf?: JustifySelf;
}

export const defaultGridLayoutOptions: GridItemLayoutProps = {
  gridAera: undefined,
  gridColumnEnd: undefined,
  gridColumnStart: undefined,
  gridRowEnd: undefined,
  gridRowStart: undefined,
  justifySelf: undefined,
};
export const defaultGridLayoutOptionsKeys = Object.keys(
  defaultGridLayoutOptions,
) as (keyof GridItemLayoutProps)[];

export const gridItemChoices: HashListChoices = [
  {
    label: 'Column start',
    value: {
      prop: 'gridColumnStart',
      schema: schemaProps.string({ label: 'Column start' }),
    },
  },
  {
    label: 'Column end',
    value: {
      prop: 'gridColumnEnd',
      schema: schemaProps.string({ label: 'Column end' }),
    },
  },

  {
    label: 'Row start',
    value: {
      prop: 'gridRowStart',
      schema: schemaProps.string({ label: 'Row start' }),
    },
  },
  {
    label: 'Row end',
    value: {
      prop: 'gridRowEnd',
      schema: schemaProps.string({ label: 'Row end' }),
    },
  },
  {
    label: 'Aera',
    value: {
      prop: 'gridAera',
      schema: schemaProps.string({ label: 'Aera' }),
    },
  },
  {
    label: 'Jusify self',
    value: {
      prop: 'justifySelf',
      schema: schemaProps.select({
        label: 'Jusify self',
        values: justifySelfValues,
        value: 'stretch',
      }),
    },
  },
  {
    label: 'Align self',
    value: {
      prop: 'alignSelf',
      schema: schemaProps.select({
        label: 'Align self',
        values: justifySelfValues,
        value: 'stretch',
      }),
    },
  },
];

const gridItemDefaultStyle = css({
  padding: '5px',
});

export interface GridItemProps
  extends WegasComponentItemProps,
    GridItemLayoutProps {
  /**
   * onMouseOut - triggers when the mouse is not more over the element
   */
  onMouseOut?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * onMouseEnter - triggers when the mouse enters the component
   */
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  (
    {
      onClick,
      onMouseOver,
      onMouseOut,
      onMouseEnter,
      onMouseLeave,
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDragEnd,
      className,
      style = {},
      tooltip,
      children,
      ...layout
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        className={gridItemDefaultStyle + classNameOrEmpty(className)}
        style={{
          position: 'relative',
          ...layout,
          ...style,
        }}
        title={tooltip}
      >
        {children}
      </div>
    );
  },
);

export const justifyItemsValues = [
  'start',
  'end',
  'center',
  'stretch',
] as const;
type JustifyItems = typeof justifyItemsValues[number];

export const justifyContentValues = [
  'grid-start',
  'grid-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
] as const;
type JustifyContent = typeof justifyContentValues[number];

export const autoFlowValues = [
  'row',
  'column',
  'row dense',
  'column dense',
] as const;
type AutoFlow = typeof autoFlowValues[number];

export const alignItemsValues = [
  'stretch',
  'grid-start',
  'grid-end',
  'center',
  'baseline',
] as const;
type AlignItems = typeof alignItemsValues[number];

export const alignContentValues = ['stretch', ...justifyContentValues] as const;
type AlignContent = typeof alignContentValues[number];

export const gridSchema = {
  layout: schemaProps.hashlist({
    label: 'Grid layout properties',
    choices: [
      {
        label: 'Template columns',
        value: {
          prop: 'gridTemplateColumns',
          schema: schemaProps.string({
            label: 'Template columns',
          }),
        },
      },
      {
        label: 'Template rows',
        value: {
          prop: 'gridTemplateRows',
          schema: schemaProps.string({
            label: 'Template rows',
          }),
        },
      },
      {
        label: 'Template aera',
        value: {
          prop: 'gridTemplateAera',
          schema: schemaProps.string({
            label: 'Template aera',
          }),
        },
      },
      {
        label: 'Column gap',
        value: {
          prop: 'columnGap',
          schema: schemaProps.string({
            label: 'Column gap',
          }),
        },
      },
      {
        label: 'Row gap',
        value: {
          prop: 'rowGap',
          schema: schemaProps.string({
            label: 'Row gap',
          }),
        },
      },
      {
        label: 'Align items',
        value: {
          prop: 'alignItems',
          schema: schemaProps.select({
            label: 'Align items',
            values: alignItemsValues,
            value: 'stretch',
          }),
        },
      },
      {
        label: 'Justify items',
        value: {
          prop: 'justifyItems',
          schema: schemaProps.select({
            label: 'Justify items',
            values: justifyItemsValues,
            value: 'stretch',
          }),
        },
      },
      {
        label: 'Justify content',
        value: {
          prop: 'justifyContent',
          schema: schemaProps.select({
            label: 'Justify content',
            values: justifyContentValues,
          }),
        },
      },
      {
        label: 'Auto columns',
        value: {
          prop: 'gridAutoColumns',
          schema: schemaProps.string({
            label: 'Justify columns',
          }),
        },
      },
      {
        label: 'Auto row',
        value: {
          prop: 'gridAutoRows',
          schema: schemaProps.string({
            label: 'Justify row',
          }),
        },
      },
      {
        label: 'Auto flow',
        value: {
          prop: 'gridAutoFlow',
          schema: schemaProps.select({
            label: 'Auto flow',
            values: autoFlowValues,
            value: 'row',
          }),
        },
      },
    ],
  }),
  children: schemaProps.hidden({}),
};

export interface GridProps extends ClassStyleId {
  /**
   * layout : the layout CSS properties
   */
  layout?: {
    /**
     * gridTemplateColumns - template for the grid columns
     */
    gridTemplateColumns?: string;
    /**
     * gridTemplateRows - template for the grid rows
     */
    gridTemplateRows?: string;
    /**
     * gridTemplateAera - allows to give name to aeras of the grid
     */
    gridTemplateAera?: string;
    /**
     * justifyItems - justify the items in the cells of the grid
     */
    justifyItems?: JustifyItems;
    /**
     * justifyContent - justifies the content of the grid
     */
    justifyContent?: JustifyContent;
    /**
     * alignItems - justifies the items perpendicularly to the grid direction
     */
    alignItems?: AlignItems;
    /**
     * alignContent - if the list display items on multiple rows, justifies the items perpendicularly in the same way than justifyContent
     */
    alignContent?: AlignContent;
    /**
     * gridAutoColumns - Specifies the size of any auto-generated grid columns
     */
    gridAutoColumns?: string;
    /**
     * gridAutoRow - Specifies the size of any auto-generated grid rows
     */
    gridAutoRows?: string;
    /**
     * gridAutoFlow - controls how the auto-placement algorithm works
     */
    gridAutoFlow?: AutoFlow;
  };
}
/**
 * Grid list.
 */
export function Grid({
  layout,
  className,
  style,
  children,
  id,
}: React.PropsWithChildren<GridProps>) {
  return (
    <div
      id={id}
      className={cx(grid, grow) + classNameOrEmpty(className)}
      style={{
        ...layout,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
