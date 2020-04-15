import * as React from 'react';
import { HashListChoices } from '../../Editor/Components/FormView/HashList';
import { schemaProps } from '../PageComponents/tools/schemaProps';

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

export interface FlexItemFlexProps {
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

export const layoutChoices: HashListChoices = [
  {
    label: 'Order',
    value: {
      prop: 'order',
      schema: schemaProps.number('Order', true, 0),
    },
  },
  {
    label: 'Align Self',
    value: {
      prop: 'alignSelf',
      schema: schemaProps.select('Align self', true, alignSelfValues, 'auto'),
    },
  },
  {
    label: 'Flex grow',
    value: {
      prop: 'flexGrow',
      schema: schemaProps.number('Flex grow', true, 0),
    },
  },
  {
    label: 'Flex shrink',
    value: {
      prop: 'flexShrink',
      schema: schemaProps.number('Flex shrink', true, 1),
    },
  },
  {
    label: 'Flex basis',
    value: {
      prop: 'flexBasis',
      schema: schemaProps.string('Flex basis', true, 'auto'),
    },
  },
];

export interface FlexItemProps extends FlexItemFlexProps {
  /**
   * onClick - triggers when the component is clicked
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * className - the class to apply to the item
   */
  className?: string;
  /**
   * style - the style to apply to the item (always prefer className over style to avoid messing with original behaviour of the item)
   */
  style?: React.CSSProperties;
}

export function FlexItem({
  order,
  alignSelf,
  flexGrow,
  flexShrink,
  flexBasis,
  onClick,
  className,
  style,
  children,
}: React.PropsWithChildren<FlexItemProps>) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        cursor: onClick ? 'pointer' : 'initial',
        position: 'relative',
        textAlign: 'center',
        order,
        alignSelf,
        flexGrow,
        flexShrink,
        flexBasis,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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

export interface FlexListProps {
  /**
   * layout : the layout CSS properties
   */
  listLayout?: {
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
  /**
   * className - the class to apply to the list
   */
  className?: string;
  /**
   * style - the style to apply to the list (always prefer className over style to avoid messing with original behaviour of the list)
   */
  style?: React.CSSProperties;
  // /**
  //  * children - the items in the list
  //  */
  // children?: FlexItemProps[];
}
/**
 * Flex list.
 */
export function FlexList({
  listLayout,
  className,
  style,
  children,
}: React.PropsWithChildren<FlexListProps>) {
  const { flexDirection, flexWrap, justifyContent, alignItems, alignContent } =
    listLayout || {};
  return (
    <div
      className={className}
      style={{
        display: 'flex',
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
