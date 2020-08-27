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

export interface PlayerButtonProps extends WegasComponentProps {
  label: string | ITranslatableContent;
  action: IScript;
}

const PlayerButton: React.FunctionComponent<PlayerButtonProps> = ({
  label,
  action,
  style,
}: PlayerButtonProps) => {
  const { lang } = React.useContext(languagesCTX);
  let computedLabel: React.ReactNode;
  if (typeof label === 'string') {
    computedLabel = label;
  } else {
    computedLabel = <div dangerouslySetInnerHTML={{__html:translate(label, lang)}}></div>;
  }
  return (
    <Button
      label={computedLabel}
      onClick={() =>
        store.dispatch(Actions.VariableInstanceActions.runScript(action!))
      }
      style={{ margin: 'auto', ...style }}
    />
  );
};

export const buttonSchema = {
  action: schemaProps.script('Action', undefined, 'SET'),
  label: schemaProps.html('Label', false)
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
      label: 'Button',
    }),
  }),
);
