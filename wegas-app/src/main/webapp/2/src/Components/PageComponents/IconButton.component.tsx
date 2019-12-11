import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';
import { IconButton, icons } from '../Button/IconButton';

registerComponent(
  pageComponentFactory(
    IconButton,
    'IconButton',
    'cube',
    {
      icon: schemaProps.select('Icon', Object.keys(icons)),
      label: schemaProps.string('Label', false),
      onClick: schemaProps.script('onClick', false),
      onMouseDown: schemaProps.script('onMouseDown', false),
      disabled: schemaProps.boolean('Disabled', false),
      pressed: schemaProps.boolean('Pressed', false),
      id: schemaProps.string('Id', false),
      tooltip: schemaProps.string('Tooltip', false),
      tabIndex: schemaProps.number('Tab index', false),
      prefixedLabel: schemaProps.boolean('Prefixed label', false),
      type: schemaProps.select('Type', ['submit', 'reset'], false),
    },
    [],
    () => ({
      icon: 'cube',
      label: 'IconButton',
    }),
  ),
);
