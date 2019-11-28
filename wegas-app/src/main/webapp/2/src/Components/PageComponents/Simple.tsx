import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { useVariableInstance } from '../Hooks/useVariable';

interface SimpleProps {
  variable: IStringDescriptor | ISNumberDescriptor;
  label: string;
}

const Simple: React.FunctionComponent<SimpleProps> = ({
  variable,
  label,
}: SimpleProps) => {
  const instance = useVariableInstance(variable);
  if (instance === undefined) {
    return <span>{`Instance of ${variable.name} not found`}</span>;
  }
  return (
    <div>
      {label && <span>{label}</span>}
      <div>
        {'trValue' in instance
          ? TranslatableContent.toString(instance.trValue)
          : String(instance.value)}
      </div>
    </div>
  );
};

export interface PageComponent {
  getComponent: () => React.FunctionComponent<{ [name: string]: unknown }>;
  getSchema: () => SimpleSchema;
  getAllowedVariables: () => (keyof WegasScriptEditorNameAndTypes)[];
  getComputedPropsFromVariable: (
    variable: WegasScriptEditorReturnType,
  ) => { [name: string]: unknown };
}

export const dynamicComponents: { [name: string]: PageComponent } = {};

const pageComponentFactory: <
  P extends { [name: string]: unknown },
  T extends keyof WegasScriptEditorNameAndTypes,
  R extends WegasScriptEditorNameAndTypes[T]
>(
  component: React.FunctionComponent<P>,
  schema: SimpleSchema,
  allowedVariables: T[],
  getComputedPropsFromVariable: (variable: R) => P,
) => PageComponent = (
  component,
  schema,
  allowedVariables,
  getComputedPropsFromVariable,
) => {
  return {
    getComponent: () => component,
    getSchema: () => schema,
    getAllowedVariables: () => allowedVariables,
    getComputedPropsFromVariable,
  };
};

const SimpleComponent = pageComponentFactory(
  Simple,
  {
    description: 'SimpleComponent',
    properties: {
      variable: {
        enum: ['INTERNAL', 'PROTECTED', 'INHERITED', 'PRIVATE'],
        required: false,
        type: 'string',
        view: {
          choices: [
            {
              label: 'Model',
              value: 'INTERNAL',
            },
            {
              label: 'Protected',
              value: 'PROTECTED',
            },
            {
              label: 'Inherited',
              value: 'INHERITED',
            },
            {
              label: 'Private',
              value: 'PRIVATE',
            },
          ],
          featureLevel: 'DEFAULT',
          index: 0,
          label: 'Variable',
          type: 'select',
        },
      },
      label: {
        required: false,
        type: 'string',
        view: {
          featureLevel: 'DEFAULT',
          index: 1,
          label: 'Label',
        },
      },
    },
  },
  ['ISNumberDescriptor', 'ISStringDescriptor'],
  variable => ({
    variable: variable,
    label: TranslatableContent.toString(variable.label),
  }),
);

const registerComponent: (
  componentName: 'SimpleComponent',
  component: PageComponent,
) => void = (componentName, component) => {
  dynamicComponents[componentName] = component;
};

registerComponent('SimpleComponent', SimpleComponent);

export default SimpleComponent;
