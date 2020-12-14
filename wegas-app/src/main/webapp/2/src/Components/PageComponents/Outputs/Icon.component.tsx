import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { classStyleIdShema } from '../tools/options';
import {
  Icon,
  IconComp,
  icons,
} from '../../../Editor/Components/Views/FontAwesome';
import { omit } from 'lodash-es';

interface PlayerIconProps extends WegasComponentProps {
  icon?: Icon;
}

function PlayerIcon({ icon, style, className }: PlayerIconProps) {
  return <IconComp icon={icon} style={style} className={className} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerIcon,
    componentType: 'Output',
    name: 'Icon',
    icon: 'icons',
    schema: {
      icon: schemaProps.select({ label: 'Icon', values: Object.keys(icons) }),
      ...omit(classStyleIdShema, ['id']),
    },
  }),
);
