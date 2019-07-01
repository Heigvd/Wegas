import * as React from 'react';
import { themeVar } from '../../Theme';
import { css } from 'emotion';
import { VariableConnect } from '../../VariableConnect';
import { TranslatableContent } from '../../../data/i18n';

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
  /**
   * displayLabel - Displays the label of the string before displaying the content
   * <Label> : <Content>
   */
  displayLabel?: boolean;
}

export default function Label(props: LabelProps) {
  return (
    <VariableConnect<IStringDescriptor> name={props.variable}>
      {({ state }) => {
        if (state === undefined) {
          return <span>Not found: {props.variable}</span>;
        }
        // debugger;
        return (
          <div>
            {props.displayLabel && (
              <span>
                {TranslatableContent.toString(state.descriptor.label) + ': '}
              </span>
            )}
            <StyledLabel
              value={TranslatableContent.toString(state.instance.trValue)}
              type={props.type}
            />
          </div>
        );
      }}
    </VariableConnect>
  );
}
