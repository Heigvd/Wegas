import * as React from 'react';
import {
  WegasComponentProps,
  WegasComponentItemProps,
} from '../PageComponents/tools/EditableComponent';
import { HashListChoices } from '../../Editor/Components/FormView/HashList';
import { schemaProps } from '../PageComponents/tools/schemaProps';

export function AbsoluteLayout({ className, children }: WegasComponentProps) {
  return <div className={className}>{children}</div>;
}

interface AbsoluteItemProps
  extends React.PropsWithChildren<WegasComponentItemProps> {
  layout?: {
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
  };
}

export const AbsoluteItem = React.forwardRef<HTMLDivElement, AbsoluteItemProps>(
  (
    {
      layout,
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
        value: { prop: 'left', schema: schemaProps.number('Left') },
      },
      {
        label: 'Right',
        value: { prop: 'right', schema: schemaProps.number('Right') },
      },
      {
        label: 'Top',
        value: { prop: 'top', schema: schemaProps.number('Top') },
      },
      {
        label: 'Bottom',
        value: { prop: 'bottom', schema: schemaProps.number('Bottom') },
      },
      {
        label: 'Foreground index',
        value: {
          prop: 'zIndex',
          schema: schemaProps.number('Foreground index'),
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
        value: { prop: 'width', schema: schemaProps.number('Width') },
      },
      {
        label: 'Height',
        value: { prop: 'height', schema: schemaProps.number('Height') },
      },
    ],
  },
];
