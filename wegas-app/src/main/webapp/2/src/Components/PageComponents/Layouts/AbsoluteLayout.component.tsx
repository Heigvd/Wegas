import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { AbsoluteLayout } from '../../Layouts/Absolute';
import { ISListDescriptor } from 'wegas-ts-api/typings/WegasScriptableEntities';


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
    ['ISListDescriptor'],
    (val?: Readonly<ISListDescriptor>) =>
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
