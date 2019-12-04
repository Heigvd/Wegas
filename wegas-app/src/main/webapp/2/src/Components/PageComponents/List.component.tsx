import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { pageComponentFactory, registerComponent } from './componentFactory';
import List, { ListProps } from '../AutoImport/Layout/List';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import {
  dndComponnent,
  DnDComponent,
} from '../../Editor/Components/Page/ComponentPalette';
import { wlog } from '../../Helper/wegaslog';
import { dropZoneClass } from '../Contexts/DefaultDndProvider';

interface ComponentDropZoneProps {
  onDrop?: (dndComponnent: DnDComponent) => void;
}

function ComponentDropZone({ onDrop }: ComponentDropZoneProps) {
  const [dropTabProps, dropTab] = useDrop({
    accept: dndComponnent,
    canDrop: () => true,
    drop: onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as DnDComponent | null,
    }),
  });
  return (
    <>
      {dropTabProps.canDrop && (
        <div
          ref={dropTab}
          className={dropZoneClass(dropTabProps.isOverCurrent)}
        >
          Drop component here
        </div>
      )}
    </>
  );
}

interface PlayerListProps extends ListProps {
  onDrop?: (dndComponent: DnDComponent, index?: number) => void;
}

const PalyerList: React.FunctionComponent<PlayerListProps> = ({
  children,
  horizontal = false,
  style,
  onDrop,
}: PlayerListProps) => {
  const content = children.reduce(
    (o, c, i) => [
      ...(i === 0
        ? [
            <ComponentDropZone
              key={i + 'BEFORE'}
              onDrop={c => onDrop && onDrop(c, i)}
            />,
            ...o,
          ]
        : o),
      c,
      <ComponentDropZone
        key={i + 'AFTER'}
        onDrop={c => onDrop && onDrop(c, i + 1)}
      />,
    ],
    [],
  );

  return (
    <List horizontal={horizontal} style={style}>
      {content}
    </List>
  );
};

const ListComponent = pageComponentFactory(
  PalyerList,
  'bars',
  {
    description: 'List',
    properties: {
      variable: {
        enum: ['INTERNAL', 'PROTECTED', 'INHERITED', 'PRIVATE'],
        required: false,
        type: 'string',
        view: {
          choices: [
            {
              label: 'Model',
              value: 'INTERNAL',
            },
            {
              label: 'Protected',
              value: 'PROTECTED',
            },
            {
              label: 'Inherited',
              value: 'INHERITED',
            },
            {
              label: 'Private',
              value: 'PRIVATE',
            },
          ],
          featureLevel: 'DEFAULT',
          index: 0,
          label: 'Variable',
          type: 'select',
        },
      },
      label: {
        required: false,
        type: 'string',
        view: {
          featureLevel: 'DEFAULT',
          index: 1,
          label: 'Label',
        },
      },
    },
  },
  ['ISNumberDescriptor', 'ISStringDescriptor'],
  () => ({
    children: [],
  }),
);

registerComponent('List', ListComponent);
