import * as React from 'react';
import {
  defaultGridLayoutOptionsKeys,
  Grid,
  GridItem,
  gridItemChoices,
  GridProps,
  gridSchema,
} from '../../Layouts/Grid';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { childrenDeserializerFactory } from './FlexList.component';

interface PlayerGridLayoutProps extends GridProps, WegasComponentProps {
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
}

function PlayerGrid(props: PlayerGridLayoutProps) {
  return <Grid {...props} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerGrid,
    componentType: 'Layout',
    container: {
      isVertical: () => false,
      ChildrenDeserializer: childrenDeserializerFactory(GridItem),
      childrenLayoutOptionSchema: gridItemChoices,
      childrenLayoutKeys: defaultGridLayoutOptionsKeys,
    },
    id: 'Grid',
    name: 'Grid layout',
    icon: 'table',
    illustration: 'grid',
    schema: { ...gridSchema, ...classStyleIdShema },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
