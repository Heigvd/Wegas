import {
  AbsoluteItem,
  AbsoluteLayout,
  absolutelayoutChoices,
  defaultAbsoluteLayoutPropsKeys,
} from '../../Layouts/Absolute';
import { onVariableChangeSchema } from '../Inputs/tools';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { classStyleIdShema } from '../tools/options';
import { childrenDeserializerFactory } from './FlexList.component';

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
      childrenLayoutOptionSchema: absolutelayoutChoices,
      childrenLayoutKeys: defaultAbsoluteLayoutPropsKeys,
    },
    id: 'AbsoluteLayout',
    name: 'Absolute layout',
    icon: 'images',
    illustration: 'absoluteLayout',
    dropzones: {
      center: true,
    },
    schema: {
      ...classStyleIdShema,
      onAbsoluteClick: onVariableChangeSchema('On absolute click'),
    },
    // {
    // name: schemaProps.string({ label: 'Name' }),
    // children: schemaProps.hidden({}),
    // },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
