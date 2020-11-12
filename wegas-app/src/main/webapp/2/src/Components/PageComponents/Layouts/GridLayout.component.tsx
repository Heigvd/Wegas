import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { classAndStyleShema } from '../tools/options';
import {
  Grid,
  GridItem,
  gridItemChoices,
  GridProps,
  gridSchema,
} from '../../Layouts/Grid';
import { WegasComponentProps } from '../tools/EditableComponent';
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
      childrenSchema: gridItemChoices,
    },
    name: 'Grid',
    icon: 'table',
    schema: { ...gridSchema, ...classAndStyleShema },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
