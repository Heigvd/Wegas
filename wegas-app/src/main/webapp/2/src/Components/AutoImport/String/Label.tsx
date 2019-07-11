import { css } from 'emotion';
import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import { themeVar } from '../../Theme';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';

interface StyledLabelProps {
  /**
   * value - the value of the text
   */
  value?: string;
  /**
   * type - changes the style of the text, normal by default
   */
  type?: 'normal' | 'warning' | 'error' | 'succes';
}

/**
 * StyledLabel is a component that creates a styled label with text
 */
export function StyledLabel({ type, value }: StyledLabelProps) {
  let color = '';

  switch (type) {
    case 'succes': {
      color = themeVar.successColor;
      break;
    }
    case 'warning': {
      color = themeVar.warningColor;
      break;
    }
    case 'error': {
      color = themeVar.errorColor;
      break;
    }
    case 'normal':
    default: {
      color = themeVar.primaryLighterColor;
      break;
    }
  }

  return (
    <div
      className={css({
        color: color,
        padding: '5px',
      })}
    >
      {value !== undefined ? value : ''}
    </div>
  );
}

interface LabelProps {
  /**
   * variable - the id of the variable to display
   */
  variable: string;
  /**
   * type - changes the style of the text, normal by default
   */
  type?: 'normal' | 'warning' | 'error' | 'succes';
}

export default function Label(props: LabelProps) {
  const descriptor = useVariableDescriptor<IStringDescriptor>(props.variable);
  const instance = useVariableInstance(descriptor);
  if (descriptor === undefined || instance === undefined) {
    return <span>Not found: {props.variable}</span>;
  }
  const label = TranslatableContent.toString(descriptor.label) + ': ';
  return (
    <div>
      {label && <span>{label}</span>}
      <StyledLabel
        value={TranslatableContent.toString(instance.trValue)}
        type={props.type}
      />
    </div>
  );
}
