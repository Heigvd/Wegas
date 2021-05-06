import * as React from 'react';
import { css, cx } from 'emotion';
import { WidgetProps, TYPESTRING } from 'jsoninput/typings/types';
import { DropMenu, SelecteDropdMenuItem } from '../../../Components/DropMenu';
import { CommonViewContainer, CommonView } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { useDrag, useDrop } from 'react-dnd';
import { dropZoneFocus } from '../../../Components/Contexts/DefaultDndProvider';
import { array_move } from '../../../Helper/tools';
import { classNameOrEmpty } from '../../../Helper/className';
import { typeCleaner } from './Script/Expressions/expressionEditorHelpers';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../../Components/Theme/ThemeVars';

const transparentStyle = css({
  opacity: 0,
  transition: 'opacity .5s .1s',
  'div:hover > &': {
    opacity: 1,
  },
});

const listElementContainerStyle = css({
  display: 'flex',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  padding: '4px',
  marginTop: '4px',
});

const listElementStyle = css({
  flex: 1,
  // Reduce vertical space between array elements:
  '& > div': {
    marginTop: 0,
  },
});

const dropZoneStyle = cx(
  dropZoneFocus,
  css({
    transition: 'min-height .5s .1s',
  }),
);

const handleStyle = css({
  display: 'inline-grid',
});

interface AdderProps<T> {
  onChildAdd: (value?: SelecteDropdMenuItem<T, DropMenuItem<T>>) => void;
  choices?: DropMenuItem<T>[];
  id?: string;
  tooltip?: string;
}

function Adder<T>({ onChildAdd, choices, id, tooltip }: AdderProps<T>) {
  if (Array.isArray(choices)) {
    return (
      <DropMenu
        items={choices}
        icon="plus-circle"
        onSelect={item => onChildAdd(item)}
      />
    );
  }
  return (
    <Button
      id={id}
      icon="plus-circle"
      onClick={() => onChildAdd()}
      tooltip={tooltip}
    />
  );
}

interface DnDArrayItem {
  type: string;
  index: number;
}

interface DnDArrayDragMonitor {
  dragStyle: React.CSSProperties;
}

interface ArrayItemProps extends ClassStyleId {
  /**
   * index - The index of the item in the array
   */
  index: number;
  /**
   * onChildRemove - the function that manages click on the trash icon (the icon won't be displayed if the function is undefined)
   */
  onChildRemove?: (index: number) => void;
  /**
   * unmovable - if set, the item could not be moved to another and the move handle won't be displayed
   */
  unmovable?: boolean;
}

const dndItemType = 'ArrayItem';

function ArrayItem({
  children,
  index,
  onChildRemove,
  unmovable,
  style,
  className,
}: React.PropsWithChildren<ArrayItemProps>) {
  const [{ dragStyle }, drag, preview] = useDrag<
    DnDArrayItem,
    unknown,
    DnDArrayDragMonitor
  >({
    item: { type: dndItemType, index },
    collect: monitor => {
      return {
        dragStyle: {
          opacity: monitor.isDragging() ? 0.4 : 1,
        },
      };
    },
  });

  return (
    <div
      ref={preview}
      className={cx(listElementContainerStyle) + classNameOrEmpty(className)}
      style={{ ...style, ...dragStyle }}
    >
      <div className={listElementStyle}>{children}</div>
      <div className={cx(handleStyle, transparentStyle)}>
        {onChildRemove ? (
          <Button
            icon="trash"
            onClick={() => onChildRemove(index)}
            tooltip="Delete this group"
          />
        ) : null}
        {!unmovable && (
          <div ref={drag}>
            <Button icon="arrows-alt" />
          </div>
        )}
      </div>
    </div>
  );
}

interface DnDArrayDropMonitor {
  isOverCurrent?: boolean;
  canDrop?: boolean;
}

interface ArrayDropzoneProps extends ClassStyleId {
  /**
   * onDrop - the function that is called when an item is dropped
   */
  onDrop: (index: number) => void;
}

function ArrayDropzone({ onDrop, className, style }: ArrayDropzoneProps) {
  const [{ isOverCurrent, canDrop }, dropTab] = useDrop<
    DnDArrayItem,
    unknown,
    DnDArrayDropMonitor
  >({
    accept: dndItemType,
    canDrop: () => true,
    drop: ({ index }) => onDrop(index),
    collect: monitor => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      className={cx(dropZoneStyle) + classNameOrEmpty(className)}
      style={{
        minHeight: isOverCurrent ? '50px' : canDrop ? '10px' : '0px',
        ...style,
      }}
      ref={dropTab}
    />
  );
}

export interface IArrayProps
  extends WidgetProps.ArrayProps<
    {
      choices?: Item<string>[];
      tooltip?: string;
      disabled?: boolean;
      userOnChildAdd?: (menuValue?: {}) => {};
      // TODO : Use the following view props!
      highlight?: boolean;
      sortable?: boolean;
    } & CommonView &
      LabeledView
  > {
  value?: {}[];
}

interface DropArrayProps<T> {
  array?: {}[];
  onMove?: (array?: {}[]) => void;
  onChildRemove?: (index: number) => void;
  onChildAdd?: (value?: SelecteDropdMenuItem<T, DropMenuItem<T>>) => void;
  choices?: DropMenuItem<T>[];
  tooltip?: string;
  label?: React.ReactNode;
  maxItems?: number;
  minItems?: number;
  inputId?: string;
  disabled?: boolean;
  readOnly?: boolean;
  unsortable?: boolean;
  filterRemovable?: boolean[];
}

export function DragDropArray<T>({
  array,
  onMove,
  onChildRemove,
  onChildAdd,
  choices,
  tooltip,
  label,
  maxItems = Infinity,
  minItems = 0,
  inputId,
  disabled,
  readOnly,
  children,
  unsortable,
  filterRemovable,
}: React.PropsWithChildren<DropArrayProps<T>>) {
  const valueLength = Array.isArray(array) ? array.length : 0;
  return (
    <>
      {label}
      {maxItems > valueLength && !disabled && !readOnly && onChildAdd && (
        <Adder
          id={inputId}
          onChildAdd={onChildAdd}
          choices={choices}
          tooltip={tooltip}
        />
      )}
      {React.Children.map(children, (c, i) => (
        <>
          {onMove && !unsortable && (
            <ArrayDropzone
              onDrop={index => {
                onMove(array_move(array, index, i));
              }}
            />
          )}
          <ArrayItem
            index={i}
            onChildRemove={
              minItems < valueLength &&
              !disabled &&
              !readOnly &&
              (!filterRemovable || filterRemovable[i])
                ? onChildRemove
                : undefined
            }
            unmovable={
              !onMove ||
              unsortable ||
              (valueLength < 2 && !disabled && !readOnly)
            }
          >
            {c}
          </ArrayItem>
        </>
      ))}
      {onMove && !unsortable && (
        <ArrayDropzone
          onDrop={index => {
            onMove(array_move(array, index, valueLength));
          }}
        />
      )}
    </>
  );
}

function ArrayWidget({
  errorMessage,
  view,
  onChange,
  // onChildAdd, //This props is given by WidgetProps.ArrayProps but it makes no sense as there is no way to configure it and it will add a null value in the array no matter the type of the array items
  onChildRemove,
  value,
  children,
  schema,
}: IArrayProps) {
  const {
    label,
    description,
    choices,
    disabled,
    readOnly,
    tooltip,
    userOnChildAdd,
    sortable,
  } = view;
  const { maxItems, minItems } = schema;
  const defaultItem = Array.isArray(schema.items)
    ? schema.items[0].value
    : schema.items?.value;
  let itemType = Array.isArray(schema.items)
    ? schema.items[0].type
    : schema.items?.type;
  while (Array.isArray(itemType)) {
    itemType = itemType[0];
  }
  const singleItemType: Exclude<typeof itemType, TYPESTRING[]> = itemType;
  const defaultNewChild: (newValue?: {} | undefined) => void = newValue =>
    typeCleaner(newValue, singleItemType || 'object', true, defaultItem);
  const onNewChild: (menuValue?: {} | undefined) => void = menuValue => {
    const newValue = [
      ...(value || []),
      (userOnChildAdd || defaultNewChild)(menuValue),
    ];
    onChange(newValue);
  };
  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ inputId, labelNode }) => (
          <DragDropArray
            onMove={onChange}
            onChildAdd={i => onNewChild(i ? i.value : undefined)}
            onChildRemove={onChildRemove}
            array={value}
            choices={choices}
            disabled={disabled}
            readOnly={readOnly}
            inputId={inputId}
            label={labelNode}
            maxItems={maxItems}
            minItems={minItems}
            tooltip={tooltip}
            unsortable={!sortable}
          >
            {children}
          </DragDropArray>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

export default ArrayWidget;
