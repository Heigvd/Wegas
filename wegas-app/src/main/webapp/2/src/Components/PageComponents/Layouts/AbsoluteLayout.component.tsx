import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  AbsoluteItem,
  AbsoluteLayout,
  absolutelayoutChoices,
  defaultAbsoluteLayoutPropsKeys,
} from '../../Layouts/Absolute';
import { childrenDeserializerFactory } from './FlexList.component';
import { classStyleIdShema } from '../tools/options';

function isVertical() {
  return undefined;
}

registerComponent(
  pageComponentFactory({
    component: AbsoluteLayout,
    componentType: 'Layout',
    container: {
      isVertical,
      ChildrenDeserializer: childrenDeserializerFactory(
        AbsoluteItem,
        {},
        () => null,
      ),
      childrenSchema: absolutelayoutChoices,
      childrenLayoutKeys: defaultAbsoluteLayoutPropsKeys,
    },
    name: 'AbsoluteLayout',
    icon: 'images',
    dropzones: {
      center: true,
    },
    schema: classStyleIdShema,
    // {
    // name: schemaProps.string({ label: 'Name' }),
    // children: schemaProps.hidden({}),
    // },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
