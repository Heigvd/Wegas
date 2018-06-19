import { parseExpression } from '@babel/parser';
import {
  booleanLiteral,
  ExpressionStatement,
  expressionStatement,
  identifier,
  numericLiteral,
  stringLiteral,
} from '@babel/types';
import Form from 'jsoninput';
import * as React from 'react';
import { VariableDescriptor } from '../../../../data/selectors';
import { getMethodConfig, MethodConfig } from '../../../editionConfig';
import {
  createVariableCallAST,
  isVariableCall,
  variableName,
} from './variableAST';
import generate from '@babel/generator';
import { Expression } from '@babel/types';
import { SpreadElement } from '@babel/types';

interface ImpactProps {
  stmt: ExpressionStatement;
  onChange: (stmt: ExpressionStatement) => void;
  mode: 'SET' | 'GET';
}
const variableSchema = {
  view: {
    type: 'variableselect',
    layout: 'inline',
  },
};
interface ExprState {
  variable?: IVariableDescriptor;
  methodsConfig: MethodConfig;
}
function astToJSONValue(ast: Expression | SpreadElement) {
  switch (ast.type) {
    case 'Identifier':
      if (ast.name === 'undefined') {
        return undefined;
      }
      return ast.name;
    default:
      return JSON.parse(generate(ast).code);
  }
}
function valueToAST(
  value: any,
  type: 'string' | 'number' | 'boolean' | 'identifier' | 'array' | 'object',
) {
  if (value === undefined) {
    return identifier('undefined');
  }
  switch (type) {
    case 'string':
      return stringLiteral(value);
    case 'number':
      return numericLiteral(value);
    case 'boolean':
      return booleanLiteral(value);
    case 'identifier':
      return identifier(value);
    case 'array':
    case 'object': {
      return parseExpression(JSON.stringify(value));
    }
    default:
      throw Error(`Unknown schema.type ${type}`);
  }
}

function argsToDefault(
  args: {
    type: 'string' | 'number' | 'boolean' | 'identifier' | 'array' | 'object';
    value?: {};
    const?: string;
  }[],
) {
  return args.map(a => valueToAST(a.const || a.value, a.type));
}
async function buildDefaultVariableCallAST(
  variable: IVariableDescriptor,
  mode: 'SET' | 'GET',
) {
  const config = await getMethodConfig(variable);
  const method = Object.keys(config).filter(
    m =>
      mode === 'SET'
        ? config[m].returns === undefined
        : config[m].returns !== undefined,
  )[0];
  if (method != null) {
    return createVariableCallAST(
      variable.name,
      method,
      argsToDefault(config[method].arguments),
    );
  }
}
export class ExprStatement extends React.Component<ImpactProps, ExprState> {
  state: ExprState = { methodsConfig: {} };
  variableChange = async (variable: string) => {
    const {
      stmt: { expression },
    } = this.props;
    const newVariable = VariableDescriptor.find('name', variable);
    if (isVariableCall(expression)) {
      const oldVariable = this.state.variable;
      if (
        newVariable &&
        oldVariable &&
        newVariable['@class'] === oldVariable['@class']
      ) {
        // Same Type
        const method = expression.callee.property.name;
        const args = expression.arguments;
        this.props.onChange(
          expressionStatement(createVariableCallAST(variable, method, args)),
        );
      } else if (newVariable) {
        this.props.onChange(
          expressionStatement(
            await buildDefaultVariableCallAST(newVariable, this.props.mode),
          ),
        );
      }
    }
  };
  methodChange = (value: string) => {
    const {
      stmt: { expression },
    } = this.props;
    if (isVariableCall(expression)) {
      const currMethod = expression.callee.property.name;
      const args = expression.arguments;
      const { methodsConfig, variable } = this.state;
      const oldCfg = methodsConfig[currMethod];
      const newCfg = methodsConfig[value];
      if (
        oldCfg &&
        newCfg &&
        oldCfg.arguments.length === newCfg.arguments.length &&
        !newCfg.arguments.some((a, i) => {
          return oldCfg.arguments[i].type !== a.type;
        })
      ) {
        // Args are identical
        this.props.onChange(
          expressionStatement(
            createVariableCallAST(variable!.name, value, args),
          ),
        );
      } else {
        this.props.onChange(
          expressionStatement(
            createVariableCallAST(
              variable!.name,
              value,
              argsToDefault(newCfg.arguments),
            ),
          ),
        );
      }
    }
  };
  argsChange = (values: any[]) => {
    const {
      stmt: { expression },
    } = this.props;
    const { methodsConfig, variable } = this.state;
    if (isVariableCall(expression)) {
      const method = expression.callee.property.name;
      this.props.onChange(
        expressionStatement(
          createVariableCallAST(
            variable!.name,
            method,
            values.map((a, i) =>
              valueToAST(a, methodsConfig[method].arguments[i].type),
            ),
          ),
        ),
      );
    }
  };
  componentDidMount() {
    const {
      stmt: { expression },
    } = this.props;
    if (isVariableCall(expression)) {
      const newVariable = VariableDescriptor.find(
        'name',
        variableName(expression.callee.object),
      );
      if (newVariable == null) {
        throw Error(`Unknown ${variableName(expression.callee.object)}`);
      }
      getMethodConfig(newVariable).then(config => {
        this.setState({
          variable: newVariable,
          methodsConfig: config,
        });
      });
    }
  }
  componentDidUpdate() {
    const {
      stmt: { expression },
    } = this.props;
    if (isVariableCall(expression)) {
      const newVariable = VariableDescriptor.find(
        'name',
        variableName(expression.callee.object),
      );
      if (newVariable == null) {
        throw Error(`Unknown ${variableName(expression.callee.object)}`);
      }
      if (newVariable['@class'] === this.state.variable!['@class']) {
        return;
      }
      getMethodConfig(newVariable).then(config => {
        this.setState({
          variable: newVariable,
          methodsConfig: config,
        });
      });
    }
  }
  render() {
    const {
      mode,
      stmt: { expression },
    } = this.props;
    const { methodsConfig } = this.state;
    const availableMethods = Object.keys(methodsConfig).filter(
      m =>
        mode === 'SET'
          ? methodsConfig[m].returns === undefined
          : methodsConfig[m].returns !== undefined,
    );
    if (isVariableCall(expression)) {
      const variable = variableName(expression.callee.object);
      const method = expression.callee.property.name;
      const args = expression.arguments;
      const formItems: MethodConfig['1']['arguments'] = methodsConfig[method]
        ? methodsConfig[method].arguments.map(
            a =>
              a.type === 'identifier'
                ? { ...a, type: 'string' as 'string' }
                : a,
          )
        : [];
      return (
        <div>
          <Form
            value={variable}
            schema={variableSchema}
            onChange={this.variableChange}
          />
          <Form
            value={method}
            schema={{
              type: 'string',
              view: {
                type: 'select',
                choices: availableMethods.map(m => ({
                  label: methodsConfig[m].label,
                  value: m,
                })),
              },
            }}
            onChange={this.methodChange}
          />
          <Form
            schema={{
              type: 'array',
              minItems: formItems.length,
              maxItems: formItems.length,
              items: formItems,
            }}
            value={args.map(a => astToJSONValue(a))}
            onChange={this.argsChange}
          />
        </div>
      );
    }
    return <pre>{JSON.stringify(expression, null, 2)}</pre>;
  }
}
