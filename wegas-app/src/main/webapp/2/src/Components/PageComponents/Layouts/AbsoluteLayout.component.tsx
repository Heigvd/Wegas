import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { AbsoluteLayout } from '../../Layouts/Absolute';
import { SListDescriptor } from 'wegas-ts-api';


registerComponent(
  pageComponentFactory(
    AbsoluteLayout,
    'Layout',
    'AbsoluteLayout',
    'bars',
    {
      name: schemaProps.string('Name', false),
      children: schemaProps.hidden(false),
    },
    ['SListDescriptor'],
    (val?: Readonly<SListDescriptor>) =>
      val
        ? {
          // children:val.itemsIds.map(id=>componentsStore.getComponentByType(VariableDescriptor.select(id)))
          children: [],
        }
        : {
          children: [],
        },
    'ABSOLUTE',
  ),
);
