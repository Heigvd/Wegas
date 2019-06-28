import * as React from 'react';
import { VariablesConnect } from '../../VariableConnect';

export default function ScriptNumberValue(props: {
  label?: string;
  script: string;
}) {
  const variables = props.script.match(/(?<=variable\(")(.*?)(?="\))/g) as
    | string[]
    | null;
  const content = (innerValue: string) => {
    return (
      <div>
        {props.label && (
          <>
            {props.label}
            <span>: </span>
          </>
        )}
        {innerValue}
      </div>
    );
  };

  if (variables === null) {
    return content(eval(props.script));
  } else {
    return (
      <VariablesConnect<INumberDescriptor> names={variables}>
        {({ state }) => {
          // @ts-ignore: The following function is used by eval from user scripts
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const variable = (name: string) => state[name].instance.value;
          try {
            return content(eval(props.script));
          } catch {
            return content('Variable not found or bad script syntax');
          }
        }}
      </VariablesConnect>
    );
  }
}
