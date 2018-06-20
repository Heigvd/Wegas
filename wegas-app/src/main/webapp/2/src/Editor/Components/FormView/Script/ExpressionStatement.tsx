import generate from '@babel/generator';
import { parseExpression } from '@babel/parser';
import {
  booleanLiteral,
  callExpression,
  EmptyStatement,
  Expression,
  ExpressionStatement,
  expressionStatement,
  identifier,
  isCallExpression,
  isEmptyStatement,
  isExpressionStatement,
  numericLiteral,
  SpreadElement,
  stringLiteral,
} from '@babel/types';
import Form from 'jsoninput';
import * as React from 'react';
import { VariableDescriptor } from '../../../../data/selectors';
import { getMethodConfig, MethodConfig } from '../../../editionConfig';
import { createGlobalCallAST, extractGlobalMethod, getGlobals } from './global';
import {
  createVariableCallAST,
  isVariableCall,
  variableName,
} from './variableAST';

interface ImpactProps {
  stmt: ExpressionStatement | EmptyStatement;
  onChange: (stmt: ExpressionStatement) => void;
  mode: 'SET' | 'GET';
}

interface ExprState {
  variable?: IVariableDescriptor;
  variableSchema: { view: any };
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
  if (type === 'identifier') {
    return identifier(value);
  }
  switch (typeof value) {
    case 'string':
      return stringLiteral(value);
    case 'number':
      return numericLiteral(value);
    case 'boolean':
      return booleanLiteral(value);
    case 'object': {
      return parseExpression(JSON.stringify(value));
    }
    default:
      throw Error(`Unknown type ${type}`);
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

function buildDefaultGlobalCAllAST(method: string, mode: 'SET' | 'GET') {
  const config = getGlobals(mode === 'GET' ? 'condition' : 'impact')[method];
  return createGlobalCallAST(method, argsToDefault(config.arguments));
}
function genGlobalItems(mode: 'SET' | 'GET') {
  return Object.entries(
    getGlobals(mode === 'GET' ? 'condition' : 'impact'),
  ).map(([k, v]) => ({
    label: v.label,
    value: `.${k}`,
  })); // Global start with a DOT
}
export class ExprStatement extends React.Component<ImpactProps, ExprState> {
  state: ExprState = {
    methodsConfig: {},
    variableSchema: {
      view: {
        type: 'variableselect',
        layout: 'inline',
        items: genGlobalItems(this.props.mode),
      },
    },
  };
  variableChange = async (variable: string) => {
    const { stmt } = this.props;
    if (variable.startsWith('.')) {
      //GLOBAL MODE
      const global = variable.slice(1);
      const call = buildDefaultGlobalCAllAST(global, this.props.mode);
      this.props.onChange(expressionStatement(call));
    } else {
      const newVariable = VariableDescriptor.find('name', variable);
      if (isExpressionStatement(stmt) && isVariableCall(stmt.expression)) {
        const expression = stmt.expression;
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
    const { stmt } = this.props;
    if (isExpressionStatement(stmt) && isVariableCall(stmt.expression)) {
      const expression = stmt.expression;
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
    const { stmt } = this.props;
    const { methodsConfig, variable } = this.state;
    if (isExpressionStatement(stmt)) {
      if (isVariableCall(stmt.expression)) {
        const expression = stmt.expression;
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
      } else if (isCallExpression(stmt.expression)) {
        const method = extractGlobalMethod(stmt.expression);
        const config = getGlobals(
          this.props.mode === 'GET' ? 'condition' : 'impact',
        )[method];
        this.props.onChange(
          expressionStatement(
            callExpression(
              stmt.expression.callee,
              values.map((a, i) => valueToAST(a, config.arguments[i].type)),
            ),
          ),
        );
      }
    }
  };
  componentDidMount() {
    const { stmt } = this.props;
    if (isExpressionStatement(stmt) && isVariableCall(stmt.expression)) {
      const expression = stmt.expression;
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
    const { stmt } = this.props;
    if (isExpressionStatement(stmt) && isVariableCall(stmt.expression)) {
      const expression = stmt.expression;
      const newVariable = VariableDescriptor.find(
        'name',
        variableName(expression.callee.object),
      );
      if (newVariable == null) {
        throw Error(`Unknown ${variableName(expression.callee.object)}`);
      }
      if (
        this.state.variable &&
        newVariable['@class'] === this.state.variable['@class']
      ) {
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
    const { mode, stmt } = this.props;
    const { methodsConfig } = this.state;
    const availableMethods = Object.keys(methodsConfig).filter(
      m =>
        mode === 'SET'
          ? methodsConfig[m].returns === undefined
          : methodsConfig[m].returns !== undefined,
    );
    if (isEmptyStatement(stmt)) {
      return (
        <Form
          schema={this.state.variableSchema}
          onChange={this.variableChange}
        />
      );
    }
    if (isVariableCall(stmt.expression)) {
      const expression = stmt.expression;
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
        <>
          <Form
            value={variable}
            schema={this.state.variableSchema}
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
        </>
      );
    }

    if (isCallExpression(stmt.expression)) {
      const expression = stmt.expression;
      const method = extractGlobalMethod(stmt.expression);
      const args = expression.arguments;
      const config = getGlobals(mode === 'GET' ? 'condition' : 'impact')[
        method
      ];
      if (config == null) {
        throw Error(`Unknown [${method}]`);
      }
      const formItems: MethodConfig['1']['arguments'] = config
        ? config.arguments.map(
            a =>
              a.type === 'identifier'
                ? { ...a, type: 'string' as 'string' }
                : a,
          )
        : [];
      return (
        <>
          <Form
            value={'.' + extractGlobalMethod(stmt.expression)}
            onChange={this.variableChange}
            schema={this.state.variableSchema}
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
        </>
      );
    }
    return <pre>{JSON.stringify(stmt, null, 2)}</pre>;
  }
}
