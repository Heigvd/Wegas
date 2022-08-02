import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { entityIs } from '../../../data/entities';
import { createScript } from '../../../Helper/wegasEntites';
import { AvailableSchemas } from '../../FormView';
import { useScript } from '../../Hooks/useScript';
import { Button, ButtonProps } from '../../Inputs/Buttons/Button';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { HTMLText } from '../../Outputs/HTMLText';
import { icons, Icons } from '../../Views/FontAwesome';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  onComponentClick,
  WegasComponentProps,
} from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

export interface PlayerButtonProps extends WegasComponentProps {
  label?: IScript;
  icon?: IScript | Icons;
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
  options,
  ...restProps
}: PlayerButtonProps) {
  const translation = useScript<string>(label, context) || '';

  const scriptedIcon = useScript<object>(
    entityIs(icon, 'Script') ? icon : '',
    context,
  ) as Icons | undefined;

  const effectiveIcon = entityIs(icon, 'Script') ? scriptedIcon : icon;

  const buttonProps: ButtonProps = React.useMemo(
    () => ({
      id: id,
      className: className,
      style: { margin: 'auto', ...style },
      icon: effectiveIcon,
      prefixedLabel: prefixedLabel,
      label:
        label && translation !== '' ? (
          <HTMLText text={translation} />
        ) : undefined,
      tooltip,
      disabled: options.disabled || options.locked,
      readOnly: options.readOnly,
    }),
    [
      className,
      effectiveIcon,
      id,
      label,
      options.disabled,
      options.locked,
      options.readOnly,
      prefixedLabel,
      style,
      tooltip,
      translation,
    ],
  );

  const onClick = React.useCallback(
    onComponentClick(restProps, context, stopPropagation, confirmClick),
    [restProps, context],
  );

  return confirm ? (
    <ConfirmButton
      onAction={(success, event) => {
        if (success && event) {
          onClick(event);
        }
      }}
      {...buttonProps}
    />
  ) : (
    <Button onClick={event => onClick(event)} {...buttonProps} />
  );
}

export const buttonSchema: Record<string, AvailableSchemas> = {
  // action: schemaProps.script({ label: 'Action', mode: 'SET' }),
  label: schemaProps.scriptString({ label: 'Label', richText: true }),
  icon: {
    view: {
      type: 'scriptable',
      label: 'Icon',
      literalSchema: schemaProps.select({
        values: Object.keys(icons),
      }),
      scriptProps: {
        language: 'TypeScript',
        returnType: ['string'],
      },
    },
  },

  prefixedLabel: schemaProps.boolean({ label: 'Prefixed label' }),
  confirm: schemaProps.boolean({ label: 'Ask confirmation' }),
  ...classStyleIdShema,
};

registerComponent(
  pageComponentFactory({
    component: PlayerButton,
    componentType: 'Input',
    manageOnClick: true,
    id: 'Button',
    name: 'Button',
    icon: 'hand-pointer',
    illustration: 'button',
    schema: buttonSchema,
    getComputedPropsFromVariable: () => ({
      label: createScript("'Button'"),
    }),
  }),
);
