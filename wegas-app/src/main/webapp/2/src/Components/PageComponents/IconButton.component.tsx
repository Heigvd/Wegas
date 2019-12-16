import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';
import { IconButton, icons } from '../Inputs/Button/IconButton';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

registerComponent(
  pageComponentFactory(
    IconButton,
    'IconButton',
    'cube',
    {
      icon: schemaProps.select('Icon', true, Object.keys(icons)),
      label: schemaProps.string('Label', false),
      onClick: schemaProps.script('onClick', false),
      onMouseDown: schemaProps.script('onMouseDown', false),
      disabled: schemaProps.boolean('Disabled', false),
      pressed: schemaProps.boolean('Pressed', false),
      id: schemaProps.string('Id', false),
      tooltip: schemaProps.string('Tooltip', false),
      tabIndex: schemaProps.number('Tab index', false),
      prefixedLabel: schemaProps.boolean('Prefixed label', false),
      type: schemaProps.select('Type', false, ['submit', 'reset']),
    },
    [],
    () => ({
      icon: 'cube' as IconProp,
      label: 'IconButton',
    }),
  ),
);
