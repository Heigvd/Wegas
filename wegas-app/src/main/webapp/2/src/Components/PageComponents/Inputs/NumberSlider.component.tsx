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
import { store } from '../../../data/Stores/store';
import { Actions } from '../../../data';
import { WegasComponentProps } from '../tools/EditableComponent';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { classStyleIdShema } from '../tools/options';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';
import { TumbleLoader } from '../../Loader';
import { useComponentScript } from '../../Hooks/useComponentScript';

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
  onVariableChange?: OnVariableChange;
}

function PlayerNumberSlider({
  script,
  context,
  className,
  style,
  id,
  onVariableChange,
  options,
  ...restProps
}: PlayerNumberSliderProps) {
  // const number = useScript<SNumberDescriptor>(script, context);
  // const player = useCurrentPlayer();

  const {
    descriptor,
    instance,
    notFound,
  } = useComponentScript<INumberDescriptor>(script, context);

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  return notFound ? (
    <TumbleLoader />
  ) : (
    <NumberSlider
      {...restProps}
      className={className}
      style={style}
      id={id}
      value={instance?.getValue()}
      onChange={(v, i) => {
        if (i === 'DragEnd') {
          if (handleOnChange) {
            handleOnChange(v);
          } else {
            store.dispatch(
              Actions.VariableInstanceActions.runScript(
                `Variable.find(gameModel,"${descriptor?.getName()}").setValue(self, ${v});`,
              ),
            );
          }
        }
      }}
      min={descriptor?.getMinValue() || -100}
      max={descriptor?.getMaxValue() || 100}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
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
      onVariableChange: onVariableChangeSchema('On number change action'),
      ...classStyleIdShema,
    },
    allowedVariables: ['NumberDescriptor'],
    getComputedPropsFromVariable: v => ({
      script: createFindVariableScript(v),
    }),
  }),
);
