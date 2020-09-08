import * as React from 'react';
import { Actions } from '../../../data';
import { store } from '../../../data/store';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { Button } from '../../Inputs/Buttons/Button';
import { createScript } from '../../../Helper/wegasEntites';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript } from 'wegas-ts-api';
import { icons, Icons } from '../../../Editor/Components/Views/FontAwesome';
import { useScript } from '../../Hooks/useScript';

export interface PlayerButtonProps extends WegasComponentProps {
  action: IScript;
  label?: IScript;
  icon?: Icons;
  prefixedLabel?: boolean;
}

function PlayerButton({
  label,
  action,
  style,
  icon,
  prefixedLabel,
}: PlayerButtonProps) {
  const translation = useScript<string>(label) || '';
  return (
    <Button
      label={
        <div
          dangerouslySetInnerHTML={{
            __html: translation,
          }}
        ></div>
      }
      onClick={() =>
        store.dispatch(Actions.VariableInstanceActions.runScript(action!))
      }
      style={{ margin: 'auto', ...style }}
      icon={icon}
      prefixedLabel={prefixedLabel}
    />
  );
}

export const buttonSchema = {
  action: schemaProps.script('Action', false, 'SET'),
  label: schemaProps.scriptString('Label', false),
  icon: schemaProps.select('Icon', true, Object.keys(icons)),
  prefixedLabel: schemaProps.boolean('Prefixed label', false),
};

const defaultLabel: ITranslatableContent = {
  '@class': 'TranslatableContent',
  translations: {
    EN: {
      '@class': 'Translation',
      lang: 'EN',
      status: '',
      translation: 'Button',
    },
  },
  version: 0,
};

registerComponent(
  pageComponentFactory({
    component: PlayerButton,
    componentType: 'Input',
    name: 'Button',
    icon: 'hand-pointer',
    schema: buttonSchema,
    getComputedPropsFromVariable: () => ({
      action: createScript(),
      label: defaultLabel,
    }),
  }),
);
