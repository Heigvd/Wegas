import * as React from 'react';
import { registerComponent, pageComponentFactory } from '../componentFactory';
import { schemaProps } from '../schemaProps';
import { NumberSlider, DisplayMode, displayModes } from '../../NumberSlider';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';
import { store } from '../../../data/store';
import { Interpolation } from 'emotion';
import { Actions } from '../../../data';
import { omit } from 'lodash';

interface PlayerNumberSliderProps {
  /**
   * variable - the variable to modify
   */
  variable?: string;
  /**
   * max - the maximum value to slide (100 by default)
   */
  max?: number;
  /**
   * min - the minimum value to slide (0 by default)
   */
  min?: number;
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
  /**
   * trackStyle - the style of the track
   */
  trackStyle?: Interpolation;
  /**
   * activePartStyle - the style of the left part of the track
   */
  activePartStyle?: Interpolation;
  /**
   * handleStyle - the style of the slider handle
   */
  handleStyle?: Interpolation;
  /**
   * disabledStyle - the style of the slider in disabled mode
   */
  disabledStyle?: Interpolation;
}

const PlayerNumberSlider: React.FunctionComponent<PlayerNumberSliderProps> = props => {
  const descriptor = useVariableDescriptor<INumberDescriptor>(props.variable);
  const instance = useVariableInstance(descriptor);
  if (
    props.variable === undefined ||
    descriptor === undefined ||
    instance === undefined
  ) {
    return <pre>Not found: {props.variable}</pre>;
  }
  const {
    min = descriptor.minValue || 0,
    max = descriptor.maxValue || 1,
  } = props;

  return (
    <NumberSlider
      value={instance.value}
      onChange={v =>
        store.dispatch(
          Actions.VariableInstanceActions.runScript(
            `Variable.find(gameModel, "${props.variable}").setValue(self, ${v});`,
          ),
        )
      }
      min={min}
      max={max}
      {...omit(props, ['variable', 'min', 'max', 'path', 'children'])}
    />
  );
};

registerComponent(
  pageComponentFactory(
    PlayerNumberSlider,
    'NumberSlider',
    'sliders-h',
    {
      variable: schemaProps.variable('Variable', true, ['NumberDescriptor']),
      max: schemaProps.number('Max', false),
      min: schemaProps.number('Min', false),
      steps: schemaProps.number('Steps', false),
      displayValues: schemaProps.select('Display value', false, displayModes),
      disabled: schemaProps.boolean('Disabled', false),
      trackStyle: schemaProps.code('Track style', false, 'JSON'),
      activePartStyle: schemaProps.code('Active part style', false, 'JSON'),
      handleStyle: schemaProps.code('Handle style', false, 'JSON'),
      disabledStyle: schemaProps.code('Disabled style', false, 'JSON'),
    },
    [],
    () => ({}),
  ),
);
