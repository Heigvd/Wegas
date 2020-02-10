import * as React from 'react';
import { css, cx } from 'emotion';
import { WidgetProps } from 'jsoninput/typings/types';
import { IconButton } from '../../../Components/Inputs/Button/IconButton';
import { Menu } from '../../../Components/Menu';
import { CommonViewContainer, CommonView } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { themeVar } from '../../../Components/Theme';
import { useDrag, useDrop } from 'react-dnd';
import { dropZoneFocusCss } from '../../../Components/Contexts/DefaultDndProvider';
import { array_move } from '../../../Helper/tools';

const transparentStyle = css({
  opacity: 0,
  transition: 'opacity .5s .1s',
  'div:hover > &': {
    opacity: 1,
  },
});

const listElementContainerStyle = css({
  display: 'flex',
  backgroundColor: themeVar.primaryHoverColor,
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

const dropZoneStyle = css({
  ...dropZoneFocusCss,
  transition: 'min-height .5s .1s',
});

const handleStyle = css({
  display: 'inline-grid',
});

function Adder(props: WidgetProps.ArrayProps & IArrayProps & { id: string }) {
  if (Array.isArray(props.view.choices)) {
    return (
      <Menu
        items={props.view.choices}
        icon="plus-circle"
        onSelect={({ value }) => props.onChildAdd(value)}
      />
    );
  }
  return (
    <IconButton
      id={props.id}
      icon="plus-circle"
      onClick={() => props.onChildAdd()}
      tooltip={props.view.tooltip}
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

interface ArrayItemProps {
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
  /**
   * className - the classes of the element
   */
  className?: string;
  /**
   * style - the classes of the element
   */
  style?: React.CSSProperties;
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
      className={cx(listElementContainerStyle, className)}
      style={{ ...style, ...dragStyle }}
    >
      <div className={listElementStyle}>{children}</div>
      <div className={cx(handleStyle, transparentStyle)}>
        {onChildRemove ? (
          <IconButton
            icon="trash"
            onClick={() => onChildRemove(index)}
            tooltip="Delete this group"
          />
        ) : null}
        {!unmovable && (
          <div ref={drag}>
            <IconButton icon="arrows-alt" />
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

interface ArrayDropzoneProps {
  /**
   * onDrop - the function that is called when an item is dropped
   */
  onDrop: (index: number) => void;
  /**
   * className - the classes of the element
   */
  className?: string;
  /**
   * style - the classes of the element
   */
  style?: React.CSSProperties;
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
      className={cx(dropZoneStyle, className)}
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
      choices?: { label: React.ReactNode; value: string }[];
      tooltip?: string;
      disabled?: boolean;
      // TODO : Use the following view props!
      highlight?: boolean;
      sortable?: boolean;
    } & CommonView &
      LabeledView
  > {
  value?: {}[];
}

function ArrayWidget(props: IArrayProps) {
  const valueLength = Array.isArray(props.value) ? props.value.length : 0;
  const { maxItems = Infinity, minItems = 0 } = props.schema;
  const disabled = props.view.disabled;
  const readOnly = props.view.readOnly;

  return (
    <CommonViewContainer errorMessage={props.errorMessage} view={props.view}>
      <Labeled label={props.view.label} description={props.view.description}>
        {({ inputId, labelNode }) => {
          return (
            <>
              {labelNode}
              {maxItems > valueLength && !disabled && !readOnly && (
                <Adder id={inputId} {...props} />
              )}
              {React.Children.map(props.children, (c, i) => (
                <>
                  <ArrayDropzone
                    onDrop={index => {
                      props.onChange(array_move(props.value, index, i));
                    }}
                  />
                  <ArrayItem
                    index={i}
                    onChildRemove={
                      minItems < valueLength && !disabled && !readOnly
                        ? props.onChildRemove
                        : undefined
                    }
                    unmovable={valueLength < 2 && !disabled && !readOnly}
                  >
                    {c}
                  </ArrayItem>
                </>
              ))}
              <ArrayDropzone
                onDrop={index => {
                  props.onChange(array_move(props.value, index, valueLength));
                }}
              />
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}

export default ArrayWidget;
