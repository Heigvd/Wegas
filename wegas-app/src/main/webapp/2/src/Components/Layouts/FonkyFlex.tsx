import * as React from 'react';
import { cx, css } from 'emotion';
import { classNameOrEmpty } from '../../Helper/className';
import { flex, flexColumn, flexRow } from '../../css/classes';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';
import { themeVar } from '../Style/ThemeVars';

const SPLITTER_SELECTOR = 'fonkyflex-splitter';
const CONTENT_SELECTOR = 'fonkyflex-content';
const VERTICAL_SELECTOR = 'fonkyflex-vertical';
const HORIZONTAL_SELECTOR = 'fonkyflex-horizontal';
const NODRAG_SELECTOR = 'fonkyflex-nodrag';

const DEFAULT_FLEX_WRAP = 1000;

// const SPLITTER_TYPE = 'Splitter';
// const CONTENT_TYPE = 'Content';
// type ContainerItemType = typeof SPLITTER_TYPE | typeof CONTENT_TYPE;

const containerStyle = css({
  [`&>.${SPLITTER_SELECTOR}.${HORIZONTAL_SELECTOR}`]: {
    height: 'auto',
    minWidth: themeVar.Splitter.dimensions.SplitterSize,
    maxWidth: themeVar.Splitter.dimensions.SplitterSize,
    borderLeft: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    borderRight: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    cursor: 'col-resize',
  },
  [`&>.${SPLITTER_SELECTOR}.${VERTICAL_SELECTOR}`]: {
    minHeight: themeVar.Splitter.dimensions.SplitterSize,
    maxHeight: themeVar.Splitter.dimensions.SplitterSize,
    borderTop: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    borderBottom: `solid 2px ${themeVar.Common.colors.BackgroundColor}`,
    width: 'auto',
    cursor: 'row-resize',
  },
});

const splitterStyle = css({
  backgroundColor: themeVar.Common.colors.MainColor,
});

export const defaultFlexContainerStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  overflow: 'auto',
};

const contentNoSelect = css({
  userSelect: 'none',
});

function getFlexGrowValues(flexItems: HTMLDivElement[]): number[] {
  return flexItems.map(c => Number(c.style.getPropertyValue('flex-grow')));
}

export interface FonkyFlexContainerProps extends ClassAndStyle {
  vertical?: boolean;
  flexValues?: number[];
  // noCheck?: boolean;
  onStartResize?: (splitterNumber: number, flexValues: number[]) => void;
  onStopResize?: (splitterNumber: number, flexValues: number[]) => void;
  onResize?: (splitterNumber: number, flexValues: number[]) => void;
}

interface FonkyFlexSplitterProps extends ClassAndStyle {
  notDraggable?: boolean;
}

interface FonkyFlexContentProps extends WegasComponentItemProps {
  flexInit?: number;
}

// TODO : Rename with resize "something"

export function FonkyFlexContainer({
  vertical,
  flexValues,
  // noCheck,
  onStartResize,
  onStopResize,
  onResize,
  className,
  style,
  children,
}: React.PropsWithChildren<FonkyFlexContainerProps>) {
  const flexChildren = React.useRef<HTMLDivElement[]>([]);
  const splitterChildren = React.useRef<HTMLDivElement[]>([]);
  const contentChildren = React.useRef<HTMLDivElement[]>([]);
  const container = React.useRef<HTMLDivElement>();
  const mouseDownTarget = React.useRef<HTMLDivElement>();

  const manageMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      const { target } = e;
      const divTarget = target as HTMLDivElement;
      if (
        typeof divTarget.className === 'string' &&
        divTarget.className.includes(SPLITTER_SELECTOR)
      ) {
        mouseDownTarget.current = divTarget;
        const splitterIndex = flexChildren.current.findIndex(
          c => c === divTarget,
        );
        if (onStartResize && splitterIndex !== -1) {
          flexChildren.current.forEach(c => {
            c.className += ' ' + contentNoSelect;
          });
          onStartResize(
            splitterIndex,
            getFlexGrowValues(contentChildren.current),
          );
        }
      }
    },
    [onStartResize],
  );

  const manageMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      const { clientX, clientY } = e;
      if (
        mouseDownTarget.current &&
        typeof mouseDownTarget.current.className === 'string' &&
        !mouseDownTarget.current.className.includes(NODRAG_SELECTOR)
      ) {
        const target = mouseDownTarget.current;
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
            ((DEFAULT_FLEX_WRAP * contentChildren.current.length) /
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
    [onResize, vertical],
  );

  const manageMouseup = React.useCallback(() => {
    if (onStopResize) {
      const splitterIndex = flexChildren.current.findIndex(
        c => c === mouseDownTarget.current,
      );
      if (splitterIndex !== -1) {
        flexChildren.current.forEach(c => {
          c.className = c.className.replace(' ' + contentNoSelect, '');
        });
        onStopResize(splitterIndex, getFlexGrowValues(contentChildren.current));
      }
    }
    mouseDownTarget.current = undefined;
  }, [onStopResize]);

  React.useEffect(() => {
    window.addEventListener('mouseup', manageMouseup);
    return () => {
      window.removeEventListener('mouseup', manageMouseup);
      // Call mouseup in case it the drag was still in progress
      manageMouseup();
    };
  }, [manageMouseup]);

  return (
    <div
      ref={e => {
        flexChildren.current = [];
        contentChildren.current = [];
        splitterChildren.current = [];
        e?.childNodes.forEach(v => {
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
        container.current = e as HTMLDivElement;
      }}
      className={
        cx(flex, vertical ? flexColumn : flexRow, containerStyle) +
        classNameOrEmpty(className)
      }
      style={style}
      onMouseDown={manageMouseDown}
      onMouseMove={manageMouseMove}
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
      style={{ ...style, ...(notDraggable ? { cursor: 'initial' } : {}) }}
      className={
        SPLITTER_SELECTOR +
        (notDraggable ? ' ' + NODRAG_SELECTOR : '') +
        classNameOrEmpty(className)
      }
    />
  );
}

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
