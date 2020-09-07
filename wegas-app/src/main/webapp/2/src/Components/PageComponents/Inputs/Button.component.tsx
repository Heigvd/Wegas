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
import { IScript, ITextDescriptor } from 'wegas-ts-api';
import { icons, Icons } from '../../../Editor/Components/Views/FontAwesome';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { useTranslate } from '../../../Editor/Components/FormView/translatable';

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
  const { instance } = useComponentScript<ITextDescriptor>(label);
  const translation = useTranslate(instance?.trValue);
  debugger;
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
  label: schemaProps.scriptVariable('Label', false, ['STextDescriptor']),
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
