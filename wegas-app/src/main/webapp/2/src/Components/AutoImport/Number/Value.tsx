import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import { VariableConnect } from '../../VariableConnect';

export default function NumberValue(props: { variable: string }) {
  return (
    <VariableConnect<INumberDescriptor> name={props.variable}>
      {({ state }) => {
        if (state === undefined) {
          return <span>Not found: {props.variable}</span>;
        }
        return (
          <div>
            {TranslatableContent.toString(state.descriptor.label)}
            <span>: </span>
            {state.instance.value}
          </div>
        );
      }}
    </VariableConnect>
  );
}
