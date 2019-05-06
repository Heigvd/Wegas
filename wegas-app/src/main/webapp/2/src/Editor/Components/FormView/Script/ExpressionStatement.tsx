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
  isBinaryExpression,
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
import { binaryExpression } from '@babel/types';
import { BinaryExpression } from '@babel/types';

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
      argsToDefault(config[method].parameters),
    );
  }
}
function getInfo(stmt: ExpressionStatement) {
  if (isCallExpression(stmt.expression)) {
    return { expression: stmt.expression };
  } else if (isBinaryExpression(stmt.expression)) {
    return {
      expression: stmt.expression.left,
      operator: stmt.expression.operator,
      right: stmt.expression.right,
    };
  }
  return {};
}
function buildDefaultGlobalCAllAST(method: string, mode: 'SET' | 'GET') {
  const config = getGlobals(mode === 'GET' ? 'condition' : 'impact')[method];
  return createGlobalCallAST(method, argsToDefault(config.parameters));
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
      if (this.props.mode === 'SET') {
        this.props.onChange(expressionStatement(call));
      } else {
        this.props.onChange(
          expressionStatement(
            binaryExpression('===', call, identifier('undefined')),
          ),
        );
      }
    } else {
      const newVariable = VariableDescriptor.first('name', variable);
      if (
        isExpressionStatement(stmt) &&
        isVariableCall(stmt.expression) &&
        newVariable &&
        this.state.variable &&
        newVariable['@class'] === this.state.variable['@class']
      ) {
        const expression = stmt.expression;
        // Same Type
        const method = expression.callee.property.name;
        const args = expression.arguments;
        this.props.onChange(
          expressionStatement(createVariableCallAST(variable, method, args)),
        );
      } else if (newVariable) {
        const call = await buildDefaultVariableCallAST(
          newVariable,
          this.props.mode,
        );
        if (this.props.mode === 'SET') {
          this.props.onChange(expressionStatement(call));
        } else {
          this.props.onChange(
            expressionStatement(
              binaryExpression('===', call, identifier('undefined')),
            ),
          );
        }
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
        oldCfg.parameters.length === newCfg.parameters.length &&
        !newCfg.parameters.some((a, i) => {
          return oldCfg.parameters[i].type !== a.type;
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
              argsToDefault(newCfg.parameters),
            ),
          ),
        );
      }
    }
  };
  operatorChange = (o: BinaryExpression['operator']) => {
    if (isEmptyStatement(this.props.stmt)) {
      return;
    }
    const { expression, operator, right } = getInfo(this.props.stmt);
    if (operator != null) {
      this.props.onChange(
        expressionStatement(binaryExpression(o, expression, right)),
      );
    }
  };
  rightChange = (e: Expression) => {
    if (isEmptyStatement(this.props.stmt)) {
      return;
    }
    const { expression, operator, right } = getInfo(this.props.stmt);
    if (right != null) {
      this.props.onChange(
        expressionStatement(binaryExpression(operator, expression, e)),
      );
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
                valueToAST(a, methodsConfig[method].parameters[i].type),
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
              values.map((a, i) => valueToAST(a, config.parameters[i].type)),
            ),
          ),
        );
      }
    }
  };
  updateConfig() {
    const { stmt } = this.props;
    if (isEmptyStatement(stmt)) {
      return;
    }
    const { expression } = getInfo(stmt);
    if (expression == null || !isVariableCall(expression)) {
      return;
    }
    const newVariable = VariableDescriptor.first(
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
  componentDidMount() {
    this.updateConfig();
  }
  componentDidUpdate() {
    this.updateConfig();
  }
  renderOpertator(
    type: MethodConfig['1'] | undefined,
    value: BinaryExpression['operator'],
  ) {
    const options: { label: string; value: BinaryExpression['operator'] }[] = [
      { label: 'equal', value: '===' },
      { label: 'different', value: '!==' },
    ];
    if (type && type.returns === 'number') {
      options.push(
        { label: 'greater', value: '>' },
        { label: 'smaller', value: '<' },
        { label: 'greater or equal', value: '>=' },
        { label: 'smaller or equal', value: '<=' },
      );
    }
    return (
      <Form
        value={value}
        schema={{
          type: 'string',
          view: {
            type: 'select',
            choices: options,
          },
        }}
        onChange={this.operatorChange}
      />
    );
  }
  renderRight(type: MethodConfig['1'] | undefined, value: Expression) {
    const schema = type != null ? { type: type.returns || 'string' } : {};
    return (
      <Form
        value={astToJSONValue(value)}
        schema={schema}
        onChange={v =>
          this.rightChange(
            valueToAST(
              v,
              type != null && type.returns != null ? type.returns : 'string',
            ),
          )
        }
      />
    );
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
    const { expression, operator, right } = getInfo(stmt);
    if (expression == null) {
      throw Error('Unhandled');
    }
    if (isVariableCall(expression)) {
      const variable = variableName(expression.callee.object);
      const method = expression.callee.property.name;
      const args = expression.arguments;
      const formItems: MethodConfig['1']['parameters'] = methodsConfig[method]
        ? methodsConfig[method].parameters.map(
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
          {operator != null
            ? this.renderOpertator(methodsConfig[method], operator)
            : null}
          {right != null
            ? this.renderRight(methodsConfig[method], right)
            : null}
        </>
      );
    }

    if (isCallExpression(expression)) {
      const method = extractGlobalMethod(expression);
      const args = expression.arguments;
      const config = getGlobals(mode === 'GET' ? 'condition' : 'impact')[
        method
      ];
      if (config == null) {
        throw Error(`Unknown [${method}]`);
      }
      const formItems: MethodConfig['1']['parameters'] = config
        ? config.parameters.map(
            a =>
              a.type === 'identifier'
                ? { ...a, type: 'string' as 'string' }
                : a,
          )
        : [];
      return (
        <>
          <Form
            value={'.' + extractGlobalMethod(expression)}
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
