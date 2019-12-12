import { registerComponent, pageComponentFactory } from '../componentFactory';
import { schemaProps } from '../schemaProps';
import { NumberSlider } from '../../NumberSlider';

registerComponent(
  pageComponentFactory(
    NumberSlider,
    'Button',
    'sliders-h',
    {
      value: schemaProps.number('Value'),
      onChange: schemaProps.script('Action', false),
      max: schemaProps.number('Max', false),
      min: schemaProps.number('Min', false),
      steps: schemaProps.number('Steps', false),
      displayValue: schemaProps.boolean('Display value', false),
      disabled: schemaProps.boolean('Disabled', false),
      trackStyle: schemaProps.code('Track style', false, 'JSON'),
      activePartStyle: schemaProps.code('Active part style', false, 'JSON'),
      handleStyle: schemaProps.code('Handle style', false, 'JSON'),
      disabledStyle: schemaProps.code('Disabled style', false, 'JSON'),
    },
    [],
    () => ({
      value: 0,
    }),
  ),
);
