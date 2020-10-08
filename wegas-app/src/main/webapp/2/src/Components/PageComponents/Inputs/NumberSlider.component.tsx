import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import {
  NumberSlider,
  DisplayMode,
  displayModes,
} from '../../Inputs/Number/NumberSlider';
import { store } from '../../../data/store';
import { Actions } from '../../../data';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, INumberDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';

interface PlayerNumberSliderProps extends WegasComponentProps {
  /**
   * script - the script that returns the variable to display and modify
   */
  script?: IScript;
  /**
   * steps - the number of steps between min and max value. 100 by default.
   */
  steps?: number;
  /**
   * displayValue - displays the value modified if set
   * Can be a boolean or a formatting function that takes the value and return a string
   */
  displayValues?: DisplayMode;
  /**
   * disabled - set the component in disabled mode
   */
  disabled?: boolean;
}

function PlayerNumberSlider(props: PlayerNumberSliderProps) {
  const { content, descriptor, instance, notFound } = useComponentScript<
    INumberDescriptor
  >(props.script);
  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <NumberSlider
      {...props}
      value={instance!.value}
      onChange={(v, i) => {
        if (i === 'DragEnd') {
          store.dispatch(
            Actions.VariableInstanceActions.runScript(
              `${content}.setValue(self, ${v});`,
            ),
          );
        }
      }}
      min={descriptor!.getMinValue() || 0}
      max={descriptor!.getMaxValue() || 1}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerNumberSlider,
    componentType: 'Input',
    name: 'NumberSlider',
    icon: 'sliders-h',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: ['SNumberDescriptor'],
      }),
      steps: schemaProps.number({ label: 'Steps' }),
      displayValues: schemaProps.select({
        label: 'Display value',
        values: displayModes,
      }),
      disabled: schemaProps.boolean({ label: 'Disabled' }),
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
