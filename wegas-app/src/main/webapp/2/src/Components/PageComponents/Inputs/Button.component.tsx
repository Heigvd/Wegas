import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { Button } from '../../Inputs/Buttons/Button';
import {
  onComponentClick,
  WegasComponentProps,
} from '../tools/EditableComponent';
import { IScript } from 'wegas-ts-api';
import { icons, Icons } from '../../../Editor/Components/Views/FontAwesome';
import { useScript } from '../../Hooks/useScript';
import { classStyleIdShema } from '../tools/options';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';

export interface PlayerButtonProps extends WegasComponentProps {
  label?: IScript;
  icon?: Icons;
  prefixedLabel?: boolean;
  confirm?: boolean;
}

function PlayerButton({
  label,
  action,
  style,
  className,
  id,
  icon,
  prefixedLabel,
  confirm,
  context,
  stopPropagation,
  confirmClick,
  tooltip,
  ...restProps
}: PlayerButtonProps) {
  const translation = useScript<string>(label, context) || '';

  const buttonProps = {
    id: id,
    className: className,
    style: { margin: 'auto', ...style },
    icon: icon,
    prefixedLabel: prefixedLabel,
    label:
      label && translation !== '' ? (
        <div
          dangerouslySetInnerHTML={{
            __html: translation,
          }}
        ></div>
      ) : undefined,
    tooltip,
  };

  const onClick = React.useCallback(
    onComponentClick(restProps, context, stopPropagation, confirmClick),
    [restProps, context],
  );

  return confirm ? (
    <ConfirmButton
      onAction={(success, event) => {
        if (success) {
          // store.dispatch(Actions.VariableInstanceActions.runScript(action!));
          onClick(event);
        }
      }}
      {...buttonProps}
    />
  ) : (
    <Button
      onClick={event =>
        // store.dispatch(Actions.VariableInstanceActions.runScript(action!))
        onClick(event)
      }
      {...buttonProps}
    />
  );
}

export const buttonSchema = {
  // action: schemaProps.script({ label: 'Action', mode: 'SET' }),
  label: schemaProps.scriptString({ label: 'Label', richText: true }),
  icon: schemaProps.select({ label: 'Icon', values: Object.keys(icons) }),
  prefixedLabel: schemaProps.boolean({ label: 'Prefixed label' }),
  confirm: schemaProps.boolean({ label: 'Ask confirmation' }),
  ...classStyleIdShema,
};

registerComponent(
  pageComponentFactory({
    component: PlayerButton,
    componentType: 'Input',
    manageOnClick: true,
    name: 'Button',
    icon: 'hand-pointer',
    schema: buttonSchema,
  }),
);
