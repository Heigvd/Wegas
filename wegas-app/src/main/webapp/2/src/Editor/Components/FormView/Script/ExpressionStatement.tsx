import { ExpressionStatement as ES } from '@babel/types';
import * as React from 'react';
import { isVariableCall, variableName } from './variableAST';
import Form from 'jsoninput';

interface ImpactProps {
  stmt: ES;
  onChange: (stmt: ES) => void;
}
export class ExpressionStatement extends React.Component<ImpactProps> {
  render() {
    const {
      stmt: { expression },
    } = this.props;
    if (isVariableCall(expression)) {
      const variable = variableName(expression.callee.object);
      const method = expression.callee.property.name;
      const args = expression.arguments;
      return (
        <div>
          <span>
            <Form
              value={variable}
              schema={{
                view: {
                  type: 'variableselect',
                  layout: 'shortInline',
                },
              }}
              onChange={v => console.log(v)}
            />
          </span>
          <span>{method} </span>
          <span>{JSON.stringify(args, null, 2)}</span>
        </div>
      );
    }
    return <pre>{JSON.stringify(expression, null, 2)}</pre>;
  }
}
