import { css, cx } from '@emotion/css';
import * as React from 'react';
import { isDnDComponent } from '../../Editor/Components/Page/ComponentPalette';
import { pageCTX } from '../../Editor/Components/Page/PageEditor';
import { isPageComponentNode } from '../../Editor/Components/Page/PagesLayout';
import { classNameOrEmpty } from '../../Helper/className';
import { wwarn } from '../../Helper/wegaslog';
import {
  OnVariableChange,
  useOnVariableChange,
} from '../PageComponents/Inputs/tools';
import {
  sanitizeExtraAttributes,
  WegasComponentItemProps,
  WegasComponentProps,
} from '../PageComponents/tools/EditableComponent';
import { schemaProps } from '../PageComponents/tools/schemaProps';

const absoluteLayoutDefaultStyle = css({
  width: '100%',
  height: '100%',
});

const highlightBorders = css({
  borderStyle: 'solid',
  borderWidth: '2px',
});

export interface AbsoluteLayoutProps extends WegasComponentProps {
  onAbsoluteClick?: OnVariableChange;
}

type AbsoluteClickFn = (coord: { x: number; y: number }) => void;

export function AbsoluteLayout({
  className,
  style,
  children,
  path,
  id,
  onAbsoluteClick,
  context,
}: AbsoluteLayoutProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [isOverCurrent, setIsOverCurrent] = React.useState(false);

  const { onDrop } = React.useContext(pageCTX);

  const { handleOnChange } = useOnVariableChange(onAbsoluteClick, context);

  const absClickRef = React.useRef<AbsoluteClickFn | undefined>(undefined);
  absClickRef.current = handleOnChange;

  const cb = React.useCallback((event: React.MouseEvent) => {
    if (absClickRef.current != null && container.current != null) {
      const bbox = container.current.getBoundingClientRect();
      absClickRef.current({
        x: event.clientX - bbox.left,
        y: event.clientY - bbox.top,
      });
    }
  }, []);

  const absClickCb = React.useMemo(() => {
    if (handleOnChange != null) {
      return cb;
    } else {
      return undefined;
    }
  }, [handleOnChange, cb]);

  return (
    <div
      ref={container}
      id={id}
      onClick={absClickCb}
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
      extraAttributes,
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
        {...sanitizeExtraAttributes(extraAttributes)}
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
