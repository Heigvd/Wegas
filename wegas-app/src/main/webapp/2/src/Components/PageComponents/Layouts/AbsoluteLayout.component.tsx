import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  AbsoluteItem,
  AbsoluteLayout,
  defaultAbsoluteLayoutPropsKeys,
} from '../../Layouts/Absolute';
import { childrenDeserializerFactory } from './FlexList.component';
import { classAndStyleShema } from '../tools/options';

function isVertical() {
  return undefined;
}

registerComponent(
  pageComponentFactory({
    component: AbsoluteLayout,
    componentType: 'Layout',
    container: {
      type: 'ABSOLUTE',
      isVertical,
      ChildrenDeserializer: childrenDeserializerFactory(
        AbsoluteItem,
        defaultAbsoluteLayoutPropsKeys,
        {},
      ),
    },
    name: 'AbsoluteLayout',
    icon: 'images',
    dropzones: {
      center: true,
    },
    schema: classAndStyleShema,
    // {
    // name: schemaProps.string({ label: 'Name' }),
    // children: schemaProps.hidden({}),
    // },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
