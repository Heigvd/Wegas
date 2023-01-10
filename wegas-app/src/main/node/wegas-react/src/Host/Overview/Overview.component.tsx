import React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../../Components/PageComponents/tools/componentFactory';
import { WegasComponentProps } from '../../Components/PageComponents/tools/EditableComponent';
import { classStyleIdShema } from '../../Components/PageComponents/tools/options';
import { schemaProps } from '../../Components/PageComponents/tools/schemaProps';
import Overview from './Overview';

/**
 * Dashboard componenent properties
 */
export interface PlayerDashboardProps extends WegasComponentProps {
  dashboardName?: string;
}

/**
 * Dashboard componenent
 */
export default function PlayerDashboard({
  dashboardName,
}: PlayerDashboardProps): JSX.Element {
  return <Overview dashboardName={dashboardName} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerDashboard,
    componentType: 'GameDesign',
    id: 'TrainerDashboard',
    name: 'Dashboard',
    icon: 'chalkboard-teacher',
    illustration: 'dashboard',
    schema: {
      dashboardName: schemaProps.string({ label: 'Dashboard name' }),
      ...classStyleIdShema,
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: () => ({
      text: '',
    }),
  }),
);
