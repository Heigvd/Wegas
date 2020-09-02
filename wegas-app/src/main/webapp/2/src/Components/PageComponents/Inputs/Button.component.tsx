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
import { translate } from '../../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { icons, Icons } from '../../../Editor/Components/Views/FontAwesome';

export interface PlayerButtonProps extends WegasComponentProps {
  label: string | ITranslatableContent;
  action: IScript;
  icon?: Icons;
  prefixedLabel?: boolean;
}

const PlayerButton: React.FunctionComponent<PlayerButtonProps> = ({
  label,
  action,
  style,
  icon,
  prefixedLabel,
}: PlayerButtonProps) => {
  const { lang } = React.useContext(languagesCTX);
  let computedLabel: React.ReactNode;
  if (typeof label === 'string') {
    computedLabel = label;
  } else {
    computedLabel = (
      <div dangerouslySetInnerHTML={{ __html: translate(label, lang) }}></div>
    );
  }
  return (
    <Button
      label={computedLabel}
      onClick={() =>
        store.dispatch(Actions.VariableInstanceActions.runScript(action!))
      }
      style={{ margin: 'auto', ...style }}
      icon={icon}
      prefixedLabel={prefixedLabel}
    />
  );
};

export const buttonSchema = {
  action: schemaProps.script('Action', undefined, 'SET'),
  label: schemaProps.html('Label', false),
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
