import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { AbsoluteLayout } from '../../Layouts/Absolute';

registerComponent(
  pageComponentFactory({
    component: AbsoluteLayout,
    componentType: 'Layout',
    containerType: 'ABSOLUTE',
    name: 'AbsoluteLayout',
    icon: 'images',
    schema: {
      name: schemaProps.string({ label: 'Name' }),
      children: schemaProps.hidden({}),
    },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
