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
      onClick={() =>
        store.dispatch(Actions.VariableInstanceActions.runScript(action!))
      }
      style={{ margin: 'auto', ...style }}
      icon={icon}
      prefixedLabel={prefixedLabel}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: translation,
        }}
      ></div>
    </Button>
  );
}

export const buttonSchema = {
  action: schemaProps.script({ label: 'Action', mode: 'SET' }),
  label: schemaProps.scriptString('Label', false),
  icon: schemaProps.select('Icon', true, Object.keys(icons)),
  prefixedLabel: schemaProps.boolean({ label: 'Prefixed label' }),
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
