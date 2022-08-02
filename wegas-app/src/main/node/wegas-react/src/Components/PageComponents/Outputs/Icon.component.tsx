import { omit } from 'lodash-es';
import * as React from 'react';
import { Icon, IconComp, icons } from '../../Views/FontAwesome';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerIconProps extends WegasComponentProps {
  icon?: Icon;
}

function PlayerIcon({ icon, style, className, options }: PlayerIconProps) {
  return (
    <IconComp
      icon={icon}
      style={style}
      className={className}
      disabled={options.disabled || options.locked}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerIcon,
    componentType: 'Output',
    id: 'Icon',
    name: 'Icon',
    icon: 'icons',
    illustration: 'icon',
    schema: {
      icon: schemaProps.select({ label: 'Icon', values: Object.keys(icons) }),
      ...omit(classStyleIdShema, ['id']),
    },
  }),
);
