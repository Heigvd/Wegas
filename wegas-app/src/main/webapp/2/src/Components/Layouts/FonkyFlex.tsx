import * as React from 'react';
import { cx, css } from 'emotion';
import { classNameOrEmpty } from '../../Helper/className';
import { flex, flexColumn, flexRow, expandBoth } from '../../css/classes';
import { themeVar } from '../Theme';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';

const SPLITTER_SELECTOR = 'fonkyflex-splitter';
const CONTENT_SELECTOR = 'fonkyflex-content';
const VERTICAL_SELECTOR = 'fonkyflex-vertical';
const HORIZONTAL_SELECTOR = 'fonkyflex-horizontal';
const NODRAG_SELECTOR = 'fonkyflex-nodrag';

const DEFAULT_FLEX_WRAP = 1000;

const SPLITTER_TYPE = 'Splitter';
const CONTENT_TYPE = 'Content';
type ContainerItemType = typeof SPLITTER_TYPE | typeof CONTENT_TYPE;

const containerStyle = css({
  [`&>.${SPLITTER_SELECTOR}.${HORIZONTAL_SELECTOR}`]: {
    height: 'auto',
    minWidth: `5px`,
    maxWidth: `5px`,
    cursor: 'col-resize',
  },
  [`&>.${SPLITTER_SELECTOR}.${VERTICAL_SELECTOR}`]: {
    minHeight: `5px`,
    maxHeight: `5px`,
    width: 'auto',
    cursor: 'row-resize',
  },
});

const splitterStyle = css({
  backgroundColor: themeVar.primaryLighterColor,
});

function isFonkyflexItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  i: any,
): i is { type: { name: ContainerItemType } } {
  return (
    i != null &&
    typeof i === 'object' &&
    'type' in i &&
    typeof i.type === 'function' &&
    'name' in i.type
  );
}

const MESSAGE_BAD_CONTENT =
  'The content of the Container can only be Splitter or Content';
const MESSAGE_BAD_STUCTURE =
  'A Splitter must be surrounded by 2 Content components';

function getFlexGrowValues(flexItems: HTMLDivElement[]): number[] {
  return flexItems.map(c => Number(c.style.getPropertyValue('flex-grow')));
}

export interface ContainerProps extends ClassAndStyle {
  vertical?: boolean;
  flexValues?: number[];
  noCheck?: boolean;
  onStartResize?: (splitterNumber: number, flexValues: number[]) => void;
  onStopResize?: (splitterNumber: number, flexValues: number[]) => void;
  onResize?: (splitterNumber: number, flexValues: number[]) => void;
}

interface SplitterProps extends ClassAndStyle {
  notDraggable?: boolean;
}

interface ContentProps extends WegasComponentItemProps {
  flexInit?: number;
}

// TODO : Rename with resize "something"

export function Container({
  vertical,
  flexValues,
  noCheck,
  onStartResize,
  onStopResize,
  onResize,
  className,
  style,
  children,
}: React.PropsWithChildren<ContainerProps>) {
  const flexChildren = React.useRef<HTMLDivElement[]>([]);
  const splitterChildren = React.useRef<HTMLDivElement[]>([]);
  const contentChildren = React.useRef<HTMLDivElement[]>([]);
  const container = React.useRef<HTMLDivElement>();
  const mouseDownTarget = React.useRef<HTMLDivElement>();

  const manageMouseup = React.useCallback(() => {
    if (onStopResize) {
      const splitterIndex = flexChildren.current.findIndex(
        c => c === mouseDownTarget.current,
      );
      if (splitterIndex !== -1) {
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

  const error = noCheck
    ? ''
    : React.Children.map(children, (c, i) => {
        if (
          !isFonkyflexItem(c) ||
          !(c.type.name === 'Splitter' || c.type.name === 'Content')
        ) {
          return MESSAGE_BAD_CONTENT;
        } else if (c.type.name === 'Splitter') {
          if (!Array.isArray(children)) {
            return MESSAGE_BAD_STUCTURE;
          } else {
            const leftContent = children[i - 1];
            const rightContent = children[i + 1];
            if (leftContent == null || rightContent == null) {
              return MESSAGE_BAD_STUCTURE;
            } else if (
              !isFonkyflexItem(leftContent) ||
              !isFonkyflexItem(rightContent)
            ) {
              return MESSAGE_BAD_CONTENT;
            } else if (
              leftContent.type.name !== 'Content' ||
              rightContent.type.name !== 'Content'
            ) {
              return MESSAGE_BAD_STUCTURE;
            }
          }
        }
      })?.reduce((o, e, i) => (e ? `${o}\n${i} : ${e}` : o), '') || '';

  if (error !== '') {
    return <pre>{error}</pre>;
  }

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
        cx(flex, vertical ? flexColumn : flexRow, expandBoth, containerStyle) +
        classNameOrEmpty(className)
      }
      style={style}
      onMouseDown={e => {
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
            onStartResize(
              splitterIndex,
              getFlexGrowValues(contentChildren.current),
            );
          }
        }
      }}
      onMouseMove={e => {
        e.stopPropagation();
        const { clientX, clientY } = e;
        if (
          mouseDownTarget.current &&
          typeof mouseDownTarget.current.className === 'string' &&
          !mouseDownTarget.current.className.includes(NODRAG_SELECTOR)
        ) {
          const target = mouseDownTarget.current;
          const splitterIndex = flexChildren.current.findIndex(
            c => c === target,
          );

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
            rightContent.style.setProperty(
              'flex-grow',
              `${maxFlex - flexLeft}`,
            );

            if (onResize) {
              onResize(
                splitterIndex,
                getFlexGrowValues(contentChildren.current),
              );
            }
          }
        }
      }}
    >
      {children}
    </div>
  );
}

export function Splitter({
  notDraggable,
  className = splitterStyle,
  style,
}: SplitterProps) {
  return (
    <div
      style={style}
      className={
        SPLITTER_SELECTOR +
        (notDraggable ? ' ' + NODRAG_SELECTOR : '') +
        classNameOrEmpty(className)
      }
    />
  );
}

export const Content = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<ContentProps>
>((props, ref) => {
  const {
    flexInit = DEFAULT_FLEX_WRAP,
    className,
    style,
    children,
    onClick,
    onMouseOver,
    onMouseLeave,
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
        overflow: 'auto',
        ...style,
      }}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      title={tooltip}
    >
      {children}
    </div>
  );
});
