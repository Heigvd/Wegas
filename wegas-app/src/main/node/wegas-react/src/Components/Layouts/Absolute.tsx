import * as React from 'react';
import {
  WegasComponentProps,
  WegasComponentItemProps,
} from '../PageComponents/tools/EditableComponent';
import { schemaProps } from '../PageComponents/tools/schemaProps';
import { pageCTX } from '../../Editor/Components/Page/PageEditor';
import { classNameOrEmpty } from '../../Helper/className';
import { cx, css } from '@emotion/css';
import { isDnDComponent } from '../../Editor/Components/Page/ComponentPalette';
import { isPageComponentNode } from '../../Editor/Components/Page/PagesLayout';
import { wwarn } from '../../Helper/wegaslog';

const absoluteLayoutDefaultStyle = css({
  width: '100%',
  height: '100%',
});

const highlightBorders = css({
  borderStyle: 'solid',
  borderWidth: '2px',
});

export function AbsoluteLayout({
  className,
  style,
  children,
  path,
  id,
}: WegasComponentProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [isOverCurrent, setIsOverCurrent] = React.useState(false);

  const { onDrop } = React.useContext(pageCTX);

  return (
    <div
      ref={container}
      id={id}
      className={
        classNameOrEmpty(className) +
        cx({ [highlightBorders]: isOverCurrent }, absoluteLayoutDefaultStyle)
      }
      style={style}
      onDragOver={e => {
        e.stopPropagation();
        e.preventDefault();
        setIsOverCurrent(true);
      }}
      onDragLeave={_e => {
        setIsOverCurrent(false);
      }}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        let fromData;
        try {
          fromData = JSON.parse(e.dataTransfer.getData('data'));
        } catch (_e) {
          fromData = undefined;
        }

        if (
          fromData != null &&
          (isDnDComponent(fromData) || isPageComponentNode(fromData))
        ) {
          if (container.current) {
            // Get the bounding rectangle of target
            const rect = e.currentTarget.getBoundingClientRect();

            // Mouse position
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            onDrop(fromData, path, undefined, {
              position: { left: x, top: y },
            });
          }
        } else {
          wwarn('Unmanaged component dropped');
        }
      }}
    >
      {children}
    </div>
  );
}

export interface AbsoluteItemLayoutProps {
  position?: {
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
  };
  size?: {
    width?: string;
    height?: string;
  };
}

export const defaultAbsoluteLayoutProps: AbsoluteItemLayoutProps = {
  position: undefined,
  size: undefined,
};
export const defaultAbsoluteLayoutPropsKeys = Object.keys(
  defaultAbsoluteLayoutProps,
) as (keyof AbsoluteItemLayoutProps)[];

type AbsoluteItemProps = React.PropsWithChildren<
  WegasComponentItemProps & AbsoluteItemLayoutProps
>;

export const AbsoluteItem = React.forwardRef<HTMLDivElement, AbsoluteItemProps>(
  (
    {
      tooltip,
      style,
      className,
      onClick,
      onMouseOver,
      onMouseLeave,
      onDragEnter,
      onDragLeave,
      onDragEnd,
      children,
      ...layout
    },
    ref,
  ) => {
    const { position = {}, size = {} } = layout || {};
    return (
      <div
        ref={ref}
        style={{ position: 'absolute', ...position, ...size, ...style }}
        title={tooltip}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        className={className}
      >
        {children}
      </div>
    );
  },
);

export const absolutelayoutChoices: HashListChoices = [
  {
    label: 'Position',
    value: { prop: 'position' },
    items: [
      {
        label: 'Left',
        value: { prop: 'left', schema: schemaProps.number({ label: 'Left' }) },
      },
      {
        label: 'Right',
        value: {
          prop: 'right',
          schema: schemaProps.number({ label: 'Right' }),
        },
      },
      {
        label: 'Top',
        value: { prop: 'top', schema: schemaProps.number({ label: 'Top' }) },
      },
      {
        label: 'Bottom',
        value: {
          prop: 'bottom',
          schema: schemaProps.number({ label: 'Bottom' }),
        },
      },
      {
        label: 'Foreground index',
        value: {
          prop: 'zIndex',
          schema: schemaProps.number({ label: 'Foreground index' }),
        },
      },
    ],
  },
  {
    label: 'Size',
    value: { prop: 'size' },
    items: [
      {
        label: 'Width',
        value: {
          prop: 'width',
          schema: schemaProps.number({ label: 'Width' }),
        },
      },
      {
        label: 'Height',
        value: {
          prop: 'height',
          schema: schemaProps.number({ label: 'Height' }),
        },
      },
    ],
  },
];
