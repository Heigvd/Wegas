import * as React from 'react';

const alignItemsValues = [
  'stretch',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
] as const;
type AlignItems = typeof alignItemsValues[number];

const alignSelfValues = ['auto', ...alignItemsValues] as const;
type AlignSelf = typeof alignSelfValues[number];

const flexBasisValues = [
  'auto',
  'content',
  'max-content',
  'min-content',
] as const;
type FlexBasis = typeof flexBasisValues[number] | string;

interface FlexListChildrenProps {
  /**
   * order - the order of the current item
   */
  order: number;
  /**
   * alignSelf - justifies the items perpendicularly to the flex direction
   */
  alignSelf: AlignSelf;
  /**
   * flexGrow - size factor of the item in the list
   */
  flexGrow: number;
  /**
   * flexShrink - size factor of the item in the list
   * Important : initial value is 1
   */
  flexShrink: number;
  /**
   * flexBasis - the initial size of the item, can be set like any css size value (%,px,em,...) or with the string "content"
   */
  flexBasis: FlexBasis;
}

export function FlexItem({
  alignSelf,
  flexGrow,
  flexShrink,
  flexBasis,
  children,
}: React.PropsWithChildren<FlexListChildrenProps>) {
  return (
    <div style={{ alignSelf, flexGrow, flexShrink, flexBasis }}>{children}</div>
  );
}

const flexDirectionValues = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
] as const;
type FlexDirection = typeof flexDirectionValues[number];

const flexWrapValues = ['nowrap', 'wrap', 'wrap-reverse'] as const;
type FlexWrap = typeof flexWrapValues[number];

const justifyContentValues = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
] as const;
type JustifyContent = typeof justifyContentValues[number];

const alignContentValues = ['stretch', ...justifyContentValues] as const;
type AlignContent = typeof alignContentValues[number];

export interface FlexListProps {
  /**
   * flexDirection - the flex direction
   */
  flexDirection: FlexDirection;
  /**
   * flexWrap - the wrap policy
   */
  flexWrap: FlexWrap;
  /**
   * justifyContent - justifies the content of the list
   */
  justifyContent: JustifyContent;
  /**
   * alignItems - justifies the items perpendicularly to the flex direction
   */
  alignItems: AlignItems;
  /**
   * alignContent - if the list display items on multiple rows, justifies the items perpendicularly in the same way than justifyContent
   */
  alignContent: AlignContent;
  /**
   * children - the items in the list
   */
  children: FlexListChildrenProps[];
}
/**
 * Flex list.
 */
export function FlexList({
  flexDirection,
  flexWrap,
  justifyContent,
  alignItems,
  alignContent,
  children,
}: React.PropsWithChildren<FlexListProps>) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection,
        flexWrap,
        justifyContent,
        alignItems,
        alignContent,
      }}
    >
      {children}
    </div>
  );
}
