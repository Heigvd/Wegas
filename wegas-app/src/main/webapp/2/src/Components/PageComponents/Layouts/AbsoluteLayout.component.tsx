import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { AbsoluteItem, AbsoluteLayout, defaultAbsoluteLayoutPropsKeys } from '../../Layouts/Absolute';
import { childrenDeserializerFactory } from "./FlexList.component"

function isVertical() {
  return undefined;
}

registerComponent(
  pageComponentFactory({
    component: AbsoluteLayout,
    componentType: 'Layout',
    container: {
      type: 'ABSOLUTE', isVertical, ChildrenDeserializer: childrenDeserializerFactory(AbsoluteItem, defaultAbsoluteLayoutPropsKeys, {})
    },
    name: 'AbsoluteLayout',
    icon: 'images',
    dropzones: {
      center: true,
    },
    schema: {
      name: schemaProps.string({ label: 'Name' }),
      children: schemaProps.hidden({}),
    },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
