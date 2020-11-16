import * as React from 'react';
import { HashListChoices } from '../../Editor/Components/FormView/HashList';
import { schemaProps } from '../PageComponents/tools/schemaProps';
import { css, cx } from 'emotion';
import { flex, grow, layoutStyle } from '../../css/classes';
import { classNameOrEmpty } from '../../Helper/className';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';

export const alignItemsValues = [
  'stretch',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
] as const;
type AlignItems = typeof alignItemsValues[number];

export const alignSelfValues = ['auto', ...alignItemsValues] as const;
type AlignSelf = typeof alignSelfValues[number];

export const flexBasisValues = [
  'auto',
  'content',
  'max-content',
  'min-content',
] as const;
type FlexBasis = typeof flexBasisValues[number] | string;

export interface FlexItemLayoutProps {
  /**
   * order - the order of the current item
   */
  order?: number;
  /**
   * alignSelf - justifies the items perpendicularly to the flex direction
   */
  alignSelf?: AlignSelf;
  /**
   * flexGrow - size factor of the item in the list
   */
  flexGrow?: number;
  /**
   * flexShrink - size factor of the item in the list
   * Important : initial value is 1
   */
  flexShrink?: number;
  /**
   * flexBasis - the initial size of the item, can be set like any css size value (%,px,em,...) or with the string "content"
   */
  flexBasis?: FlexBasis;
}

export const defaultFlexLayoutOptions: FlexItemLayoutProps = {
  alignSelf: undefined,
  flexBasis: undefined,
  flexGrow: undefined,
  flexShrink: undefined,
  order: undefined,
};
export const defaultFlexLayoutOptionsKeys = Object.keys(
  defaultFlexLayoutOptions,
) as (keyof FlexItemLayoutProps)[];

export const flexlayoutChoices: HashListChoices = [
  {
    label: 'Order',
    value: {
      prop: 'order',
      schema: schemaProps.number({ label: 'Order', value: 0 }),
    },
  },
  {
    label: 'Align Self',
    value: {
      prop: 'alignSelf',
      schema: schemaProps.select({
        label: 'Align self',
        values: alignSelfValues,
        value: 'auto',
      }),
    },
  },
  {
    label: 'Flex grow',
    value: {
      prop: 'flexGrow',
      schema: schemaProps.number({ label: 'Flex grow', value: 0 }),
    },
  },
  {
    label: 'Flex shrink',
    value: {
      prop: 'flexShrink',
      schema: schemaProps.number({ label: 'Flex shrink', value: 1 }),
    },
  },
  {
    label: 'Flex basis',
    value: {
      prop: 'flexBasis',
      schema: schemaProps.string({ label: 'Flex basis', value: 'auto' }),
    },
  },
];

const flexItemDefaultStyle = css({
  position: 'relative',
  padding: '5px',
});

export interface FlexItemProps
  extends WegasComponentItemProps,
    React.PropsWithChildren<FlexItemLayoutProps> {
  /**
   * onMouseOut - triggers when the mouse is not more over the element
   */
  onMouseOut?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * onMouseEnter - triggers when the mouse enters the component
   */
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const FlexItem = React.forwardRef<HTMLDivElement, FlexItemProps>(
  (
    {
      onClick,
      onMouseOver,
      onMouseOut,
      onMouseEnter,
      onMouseLeave,
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
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        className={flexItemDefaultStyle + classNameOrEmpty(className)}
        style={{
          // position: 'relative',
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

export const flexDirectionValues = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
] as const;
type FlexDirection = typeof flexDirectionValues[number];

export const flexWrapValues = ['nowrap', 'wrap', 'wrap-reverse'] as const;
type FlexWrap = typeof flexWrapValues[number];

export const justifyContentValues = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
] as const;
type JustifyContent = typeof justifyContentValues[number];

export const alignContentValues = ['stretch', ...justifyContentValues] as const;
type AlignContent = typeof alignContentValues[number];

export const flexListSchema = {
  layout: schemaProps.hashlist({
    label: 'List layout properties',
    choices: [
      {
        label: 'Direction',
        value: {
          prop: 'flexDirection',
          schema: schemaProps.select({
            label: 'Direction',
            values: flexDirectionValues,
            value: 'row',
          }),
        },
      },
      {
        label: 'Wrap',
        value: {
          prop: 'flexWrap',
          schema: schemaProps.select({ label: 'Wrap', values: flexWrapValues }),
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
        label: 'Align items',
        value: {
          prop: 'alignItems',
          schema: schemaProps.select({
            label: 'Align items',
            values: alignItemsValues,
          }),
        },
      },
      {
        label: 'Align content',
        value: {
          prop: 'alignContent',
          schema: schemaProps.select({
            label: 'Align content',
            values: alignContentValues,
          }),
        },
      },
    ],
  }),
  children: schemaProps.hidden({}),
};

export interface FlexListProps extends ClassAndStyle {
  /**
   * layout : the layout CSS properties
   */
  layout?: {
    /**
     * flexDirection - the flex direction
     */
    flexDirection?: FlexDirection;
    /**
     * flexWrap - the wrap policy
     */
    flexWrap?: FlexWrap;
    /**
     * justifyContent - justifies the content of the list
     */
    justifyContent?: JustifyContent;
    /**
     * alignItems - justifies the items perpendicularly to the flex direction
     */
    alignItems?: AlignItems;
    /**
     * alignContent - if the list display items on multiple rows, justifies the items perpendicularly in the same way than justifyContent
     */
    alignContent?: AlignContent;
  };
}
/**
 * Flex list.
 */
export function FlexList({
  layout,
  className,
  style,
  children,
}: React.PropsWithChildren<FlexListProps>) {
  const { flexDirection, flexWrap, justifyContent, alignItems, alignContent } =
    layout || {};
  return (
    <div
      className={cx(flex, grow, layoutStyle) + classNameOrEmpty(className)}
      style={{
        flexDirection,
        flexWrap,
        justifyContent,
        alignItems,
        alignContent,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function isVertical(props?: FlexListProps) {
  return (
    props?.layout?.flexDirection === 'column' ||
    props?.layout?.flexDirection === 'column-reverse'
  );
}
