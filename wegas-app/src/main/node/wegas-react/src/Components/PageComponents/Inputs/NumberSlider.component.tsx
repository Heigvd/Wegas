import { debounce } from 'lodash-es';
import * as React from 'react';
import { IScript, SNumberDescriptor } from 'wegas-ts-api';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { useScript } from '../../Hooks/useScript';
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

interface NumberSliderNumber {
  value: number;
  min: number;
  max: number;
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
  const { somethingIsUndefined } = useInternalTranslate(commonTranslations);
  const { pageId, path } = restProps;

  const number = useScript<SNumberDescriptor | NumberSliderNumber>(
    script,
    context,
  );

  const value = useStore(() =>
    entityIs(number, 'NumberDescriptor')
      ? (number as SNumberDescriptor).getValue(Player.self())
      : (number as NumberSliderNumber).value,
  );

  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  const doUpdate = React.useCallback(
    (newValue: number) => {
      if (handleOnChange) {
        handleOnChange(newValue);
      } else if (entityIs(number, 'NumberDescriptor')) {
        editingStore.dispatch(
          Actions.VariableInstanceActions.runScript(
            `Variable.find(gameModel,"${(
              number as SNumberDescriptor
            ).getName()}").setValue(self, ${newValue});`,
          ),
        );
      }
    },
    [handleOnChange, number],
  );

  const debouncedOnChange = React.useMemo(() => {
    return debounce((value: number) => {
      doUpdate(value);
    }, 300);
  }, [doUpdate]);

  return number == null ? (
    <UncompleteCompMessage
      message={somethingIsUndefined('Number')}
      pageId={pageId}
      path={path}
    />
  ) : (
    <NumberSlider
      {...restProps}
      className={className}
      style={style}
      id={id}
      value={value}
      onChange={(v, i) => {
        if (i === 'DragEnd') {
          doUpdate(v);
        } else if (i === 'NumberInput') {
          debouncedOnChange(v);
        }
      }}
      min={
        entityIs(number, 'NumberDescriptor')
          ? (number as SNumberDescriptor).getMinValue() ?? -100
          : (number as NumberSliderNumber).min
      }
      max={
        entityIs(number, 'NumberDescriptor')
          ? (number as SNumberDescriptor).getMaxValue() ?? 100
          : (number as NumberSliderNumber).max
      }
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerNumberSlider,
    componentType: 'Input',
    id: 'NumberSlider',
    name: 'Number slider',
    icon: 'sliders-h',
    illustration: 'numberSlider',
    schema: {
      script: schemaProps.scriptVariable({
        label: 'Variable',
        required: true,
        returnType: [
          'SNumberDescriptor',
          '{value:number; min:number; max:number}',
        ],
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
