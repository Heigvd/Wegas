import { debounce } from 'lodash-es';
import * as React from 'react';
import { INumberDescriptor, IScript } from 'wegas-ts-api';
import { Actions } from '../../../data';
import { store } from '../../../data/Stores/store';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useComponentScript } from '../../Hooks/useComponentScript';
import {
  DisplayMode,
  displayModes,
  NumberSlider,
} from '../../Inputs/Number/NumberSlider';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';

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

  const { descriptor, instance, notFound } =
    useComponentScript<INumberDescriptor>(script, context);

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const variableName = descriptor?.getName();

  const doUpdate = React.useCallback(
    (newValue: number) => {
      if (handleOnChange) {
        handleOnChange(newValue);
      } else {
        if (variableName) {
          store.dispatch(
            Actions.VariableInstanceActions.runScript(
              `Variable.find(gameModel,"${variableName}").setValue(self, ${newValue});`,
            ),
          );
        }
      }
    },
    [handleOnChange, variableName],
  );

  const debouncedOnChange = React.useMemo(() => {
    return debounce((value: number) => {
      doUpdate(value);
    }, 300);
  }, [doUpdate]);

  return notFound ? (
    <UncompleteCompMessage />
  ) : (
    <NumberSlider
      {...restProps}
      className={className}
      style={style}
      id={id}
      value={instance?.getValue()}
      onChange={(v, i) => {
        if (i === 'DragEnd') {
          doUpdate(v);
        } else if (i === 'NumberInput') {
          debouncedOnChange(v);
        }
      }}
      min={descriptor?.getMinValue() != null ? descriptor.getMinValue()! : -100}
      max={descriptor?.getMaxValue() != null ? descriptor.getMaxValue()! : 100}
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
    illustration: 'numberSlider',
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
