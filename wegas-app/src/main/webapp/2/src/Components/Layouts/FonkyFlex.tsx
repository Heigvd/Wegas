import * as React from 'react';
import { cx, css } from 'emotion';
import { classNameOrEmpty } from '../../Helper/className';
import { flex, flexColumn, flexRow } from '../../css/classes';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';
import { themeVar } from '../Theme/ThemeVars';
import { schemaProps } from '../PageComponents/tools/schemaProps';

const SPLITTER_SELECTOR = 'fonkyflex-splitter';
const CONTENT_SELECTOR = 'fonkyflex-content';
const VERTICAL_SELECTOR = 'fonkyflex-vertical';
const HORIZONTAL_SELECTOR = 'fonkyflex-horizontal';
const NODRAG_SELECTOR = 'fonkyflex-nodrag';

const DEFAULT_FLEX_WRAP = 1000;

const noSelectStyle = css({
  userSelect: 'none',
});

const containerStyle = css({
  [`&>.${SPLITTER_SELECTOR}.${HORIZONTAL_SELECTOR}`]: {
    height: 'auto',
    minWidth: '5px',
    maxWidth: '5px',
    borderLeft: `solid 2px ${themeVar.colors.BackgroundColor}`,
    borderRight: `solid 2px ${themeVar.colors.BackgroundColor}`,
    cursor: 'col-resize',
  },
  [`&>.${SPLITTER_SELECTOR}.${VERTICAL_SELECTOR}`]: {
    minHeight: '5px',
    maxHeight: '5px',
    borderTop: `solid 2px ${themeVar.colors.BackgroundColor}`,
    borderBottom: `solid 2px ${themeVar.colors.BackgroundColor}`,
    width: 'auto',
    cursor: 'row-resize',
  },
});

const splitterStyle = css({
  backgroundColor: themeVar.colors.PrimaryColor,
});

export const defaultFlexContainerStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  overflow: 'auto',
};

function getFlexGrowValues(flexItems: HTMLDivElement[]): number[] {
  return flexItems.map(c => Number(c.style.getPropertyValue('flex-grow')));
}

export interface FonkyFlexContainerProps extends ClassStyleId {
  vertical?: boolean;
  flexValues?: number[];
  lockSplitters?: boolean;
  onStartResize?: (splitterNumber: number, flexValues: number[]) => void;
  onStopResize?: (splitterNumber: number, flexValues: number[]) => void;
  onResize?: (splitterNumber: number, flexValues: number[]) => void;
}

interface FonkyFlexSplitterProps extends ClassStyleId {
  notDraggable?: boolean;
}

interface FonkyFlexContentProps extends WegasComponentItemProps {
  flexInit?: number;
}

export const defaultFonkyFlexLayoutProps: FonkyFlexContentProps = {
  flexInit: undefined,
};

export const defaultFonkyFlexLayoutPropsKeys = Object.keys(
  defaultFonkyFlexLayoutProps,
) as (keyof FonkyFlexContentProps)[];

// TODO : Rename with resize "something"

export function FonkyFlexContainer({
  vertical,
  flexValues,
  lockSplitters,
  onStartResize,
  onStopResize,
  onResize,
  className,
  style,
  children,
  id,
}: React.PropsWithChildren<FonkyFlexContainerProps>) {
  const flexChildren = React.useRef<HTMLDivElement[]>([]);
  const splitterChildren = React.useRef<HTMLDivElement[]>([]);
  const contentChildren = React.useRef<HTMLDivElement[]>([]);
  const container = React.useRef<HTMLDivElement>();
  const draggedElement = React.useRef<HTMLDivElement | null>();

  const onDragStart = React.useCallback(
    (e: MouseEvent) => {
      if (!lockSplitters) {
        e.stopPropagation();
        const { target } = e;
        const divTarget = target as HTMLDivElement;
        draggedElement.current = divTarget;

        if (
          typeof divTarget.className === 'string' &&
          divTarget.className.includes(SPLITTER_SELECTOR)
        ) {
          const splitterIndex = flexChildren.current.findIndex(
            c => c === divTarget,
          );
          if (onStartResize && splitterIndex !== -1) {
            flexChildren.current.forEach(c => {
              c.className += ' ' + noSelectStyle;
            });
            onStartResize(
              splitterIndex,
              getFlexGrowValues(contentChildren.current),
            );
          }
        }
      }
    },
    [lockSplitters, onStartResize],
  );

  const onDrag = React.useCallback(
    (e: MouseEvent) => {
      if (!lockSplitters) {
        e.stopPropagation();
        const { clientX, clientY } = e;
        const target = draggedElement.current;

        const splitterIndex = flexChildren.current.findIndex(c => c === target);

        const leftContent = flexChildren.current[splitterIndex - 1];
        const rightContent = flexChildren.current[splitterIndex + 1];

        if (leftContent && rightContent && container.current) {
          const containerBox = container.current.getBoundingClientRect();
          const leftBox = leftContent.getBoundingClientRect();
          const rightBox = rightContent.getBoundingClientRect();
          const maxSize = vertical
            ? rightBox.height + leftBox.height
            : rightBox.width + leftBox.width;
          const delta = vertical
            ? clientY - leftBox.top
            : clientX - leftBox.left;
          const splittersSize = splitterChildren.current.reduce(
            (o, f) =>
              o +
              (vertical
                ? f.getBoundingClientRect().height
                : f.getBoundingClientRect().width),
            0,
          );

          const maxFlex =
            (contentChildren.current.reduce(
              (o, i) => o + Number(i.style.getPropertyValue('flex-grow')),
              0,
            ) /
              ((vertical ? containerBox.height : containerBox.width) -
                splittersSize)) *
            maxSize;
          const flexLeft = Math.max(
            Math.min((delta / maxSize) * maxFlex, maxFlex),
            0,
          );

          leftContent.style.setProperty('flex-grow', `${flexLeft}`);
          rightContent.style.setProperty('flex-grow', `${maxFlex - flexLeft}`);

          if (onResize) {
            onResize(splitterIndex, getFlexGrowValues(contentChildren.current));
          }
        }
      }
    },
    [lockSplitters, onResize, vertical],
  );

  const onDragStop = React.useCallback(
    (e: MouseEvent) => {
      if (!lockSplitters) {
        onDrag(e);
        const target = draggedElement.current;

        draggedElement.current = null;

        const splitterIndex = flexChildren.current.findIndex(c => c === target);
        if (splitterIndex !== -1) {
          flexChildren.current.forEach(c => {
            c.className = c.className.replace(' ' + noSelectStyle, '');
          });
          if (onStopResize) {
            onStopResize(
              splitterIndex,
              getFlexGrowValues(contentChildren.current),
            );
          }
        }
      }
    },
    [lockSplitters, onDrag, onStopResize],
  );

  React.useEffect(() => {
    // The mousemove and mouseup event is catched in the whole browser window to avoid missing an event when out of the document
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', onDragStop);

    return () => {
      contentChildren.current.forEach(item =>
        item.removeEventListener('mousedown', onDragStart),
      );
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', onDragStop);
    };
  }, [onDrag, onDragStart, onDragStop]);

  return (
    <div
      id={id}
      ref={e => {
        flexChildren.current = [];
        contentChildren.current = [];
        splitterChildren.current = [];
        if (e != null) {
          e.childNodes.forEach(v => {
            const child = v as HTMLDivElement;
            if (child.className.includes(SPLITTER_SELECTOR)) {
              splitterChildren.current.push(child);
              if (vertical && !child.className.includes(VERTICAL_SELECTOR)) {
                child.className += ' ' + VERTICAL_SELECTOR;
              } else if (
                !vertical &&
                !child.className.includes(HORIZONTAL_SELECTOR)
              ) {
                child.className += ' ' + HORIZONTAL_SELECTOR;
              }

              child.addEventListener('mousedown', onDragStart);
            } else if (child.className.includes(CONTENT_SELECTOR)) {
              if (flexValues && flexValues[contentChildren.current.length]) {
                child.style.setProperty(
                  'flex-grow',
                  String(flexValues[contentChildren.current.length]),
                );
              }
              contentChildren.current.push(child);
            }
            flexChildren.current.push(child);
          });
        }
        container.current = e as HTMLDivElement;
      }}
      className={
        cx(flex, vertical ? flexColumn : flexRow, containerStyle) +
        classNameOrEmpty(className)
      }
      style={style}
    >
      {children}
    </div>
  );
}

export function FonkyFlexSplitter({
  notDraggable,
  className = splitterStyle,
  style,
}: FonkyFlexSplitterProps) {
  return (
    <div
      style={{
        ...style,
        ...(notDraggable ? { cursor: 'initial' } : {}),
      }}
      className={
        SPLITTER_SELECTOR +
        (notDraggable ? ' ' + NODRAG_SELECTOR : '') +
        classNameOrEmpty(className)
      }
      draggable={true}
    />
  );
}

export const fonkyFlexContainerChoices: HashListChoices = [
  {
    label: 'Flex init value',
    value: {
      prop: 'flexInit',
      schema: schemaProps.number({ label: 'Flex init value' }),
    },
  },
];

export const FonkyFlexContent = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<FonkyFlexContentProps>
>((props, ref) => {
  const {
    flexInit = DEFAULT_FLEX_WRAP,
    className,
    style,
    children,
    onClick,
    onMouseOver,
    onMouseLeave,
    onDragEnter,
    onDragLeave,
    onDragEnd,
    tooltip,
  } = props;
  return (
    <div
      ref={ref}
      className={CONTENT_SELECTOR + classNameOrEmpty(className)}
      style={{
        position: 'relative',
        flexGrow: flexInit,
        flexBasis: 0,
        height: '100%',
        width: '100%',
        overflow: 'auto',
        ...style,
      }}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      title={tooltip}
    >
      {children}
    </div>
  );
});
