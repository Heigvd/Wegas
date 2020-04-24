import * as React from 'react';
import { cx, css } from 'emotion';
import { classNameOrEmpty } from '../../Helper/className';
import { flex, flexColumn, flexRow, expandBoth } from '../../css/classes';
import { themeVar } from '../Theme';

const SPLITTER_SELECTOR = 'flexlayout-splitter';

const splitterStyle = css({
  backgroundColor: themeVar.primaryLighterColor,
});

function isFlexLayoutItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  i: any,
): i is { type: { name: 'Content' | 'Splitter' } } {
  return (
    i != null ||
    typeof i === 'object' ||
    'type' in i ||
    typeof i.type === 'function' ||
    'name' in i.type
  );
}

const FLEXLAYOUT_BAD_CONTENT =
  'The content of the FlexLayout can only be FlexLayout.Splitter or FlexLayout.Content';
const FLEXLAYOUT_BAD_STUCTURE =
  'A FlexLayout.Splitter must be surrounded by 2 FlexLayout.Content';

interface FlexLayoutProps extends ClassAndStyle {
  vertical?: boolean;
}

interface FlexLayoutSplitterProps extends ClassAndStyle {
  size?: number;
}

interface FlexLayoutContentProps extends ClassAndStyle {
  initFlex?: number;
}

export function useFlexLayout(
  vertical?: boolean,
  flexPrecision: number = 1000,
) {
  const MAX_FLEX = flexPrecision * 2;
  const flexChildren = React.useRef<HTMLDivElement[]>([]);
  const container = React.useRef<HTMLDivElement>();

  return Object.assign(
    function FlexLayout({
      className,
      style,
      children,
    }: React.PropsWithChildren<FlexLayoutProps>) {
      const mouseDownTarget = React.useRef<HTMLDivElement>();

      const error =
        React.Children.map(children, (c, i) => {
          if (
            !isFlexLayoutItem(c) ||
            !(c.type.name === 'Splitter' || c.type.name === 'Content')
          ) {
            return FLEXLAYOUT_BAD_CONTENT;
          } else if (c.type.name === 'Splitter') {
            if (!Array.isArray(children)) {
              return FLEXLAYOUT_BAD_STUCTURE;
            } else {
              const leftContent = children[i - 1];
              const rightContent = children[i + 1];
              if (leftContent == null || rightContent == null) {
                return FLEXLAYOUT_BAD_STUCTURE;
              } else if (
                !isFlexLayoutItem(leftContent) ||
                !isFlexLayoutItem(rightContent)
              ) {
                return FLEXLAYOUT_BAD_CONTENT;
              } else if (
                leftContent.type.name !== 'Content' ||
                rightContent.type.name !== 'Content'
              ) {
                return FLEXLAYOUT_BAD_STUCTURE;
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
            e?.childNodes.forEach(v =>
              flexChildren.current.push(v as HTMLDivElement),
            );
            container.current = e as HTMLDivElement;
          }}
          className={
            cx(flex, vertical ? flexColumn : flexRow, expandBoth) +
            classNameOrEmpty(className)
          }
          style={style}
          onMouseDown={({ target }) => {
            const divTarget = target as HTMLDivElement;
            if (divTarget.className.includes(SPLITTER_SELECTOR)) {
              mouseDownTarget.current = divTarget;
            }
          }}
          onMouseUp={() => {
            mouseDownTarget.current = undefined;
          }}
          onMouseMove={({ clientX, clientY }) => {
            if (mouseDownTarget.current) {
              const target = mouseDownTarget.current;
              const splitterIndex = flexChildren.current.findIndex(
                c => c === target,
              );

              const leftContent = flexChildren.current[
                splitterIndex - 1
              ] as HTMLDivElement;
              const rightContent = flexChildren.current[
                splitterIndex + 1
              ] as HTMLDivElement;

              if (leftContent && rightContent && container.current) {
                const containerBox = container.current.getBoundingClientRect();
                const splitterBox = mouseDownTarget.current.getBoundingClientRect();
                const leftBox = leftContent.getBoundingClientRect();
                const rightBox = rightContent.getBoundingClientRect();
                const maxSize = vertical
                  ? rightBox.height + leftBox.height + splitterBox.height
                  : rightBox.width + leftBox.width + splitterBox.width;
                const delta = vertical
                  ? clientY - (leftBox.top - containerBox.top)
                  : clientX - (leftBox.left - containerBox.left);

                const flexLeft = Math.max(
                  Math.min((delta / maxSize) * MAX_FLEX, MAX_FLEX),
                  0,
                );

                leftContent.style.setProperty('flex-grow', `${flexLeft}`);
                rightContent.style.setProperty(
                  'flex-grow',
                  `${MAX_FLEX - flexLeft}`,
                );
              }
            }
          }}
        >
          {children}
        </div>
      );
    },
    {
      Splitter({
        size = 5,
        className = splitterStyle,
        style,
      }: FlexLayoutSplitterProps) {
        return (
          <div
            style={{
              ...(vertical
                ? {
                    minHeight: `${size}px`,
                    maxHeight: `${size}px`,
                    width: 'auto',
                    cursor: 'row-resize',
                  }
                : {
                    height: 'auto',
                    minWidth: `${size}px`,
                    maxWidth: `${size}px`,
                    cursor: 'col-resize',
                  }),
              ...style,
            }}
            className={SPLITTER_SELECTOR + classNameOrEmpty(className)}
          />
        );
      },
      Content({
        initFlex = flexPrecision,
        className,
        style,
        children,
      }: React.PropsWithChildren<FlexLayoutContentProps>) {
        return (
          <div
            className={className}
            style={{
              flexGrow: initFlex,
              flexBasis: 0,
              overflow: 'auto',
              ...style,
            }}
          >
            {children}
          </div>
        );
      },
    },
  );
}
