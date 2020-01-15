import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import {
  NumberSlider,
  DisplayMode,
  displayModes,
} from '../../Inputs/Button/NumberSlider';
import { useVariableInstance } from '../../Hooks/useVariable';
import { store } from '../../../data/store';
import { Interpolation } from 'emotion';
import { Actions } from '../../../data';
import { omit } from 'lodash';
import { useScript } from '../../Hooks/useScript';

interface PlayerNumberSliderProps extends PageComponentMandatoryProps {
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

function PlayerNumberSlider(props: PlayerNumberSliderProps) {
  const { script, EditHandle } = props;
  const content = script ? script.content : '';
  const descriptor = useScript(content) as INumberDescriptor;
  const instance = useVariableInstance(descriptor);
  if (content === '' || descriptor === undefined || instance === undefined) {
    return (
      <>
        <EditHandle />
        <pre>Not found: {script}</pre>
      </>
    );
  }

  const min = descriptor.minValue || 0;
  const max = descriptor.maxValue || 1;

  return (
    <>
      <EditHandle />
      <NumberSlider
        value={instance.value}
        onChange={v =>
          store.dispatch(
            Actions.VariableInstanceActions.runScript(
              `${script}.setValue(self, ${v});`,
            ),
          )
        }
        min={min}
        max={max}
        {...omit(props, ['variable', 'min', 'max', 'path', 'children'])}
      />
    </>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerNumberSlider,
    'NumberSlider',
    'sliders-h',
    {
      script: schemaProps.scriptVariable(
        'Variable',
        true,
        ['NumberDescriptor'],
        true,
      ),
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
