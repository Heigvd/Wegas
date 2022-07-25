import { parse } from '@babel/parser';
import { emptyStatement, Statement } from '@babel/types';
import { Schema, TYPESTRING } from 'jsoninput/typings/types';
import { pick } from 'lodash-es';
import { SVariableDescriptor } from 'wegas-ts-api';
import { AvailableSchemas, AvailableViews } from '../..';
import { safeClientScriptEval } from '../../../../../Components/Hooks/useScript';
import { schemaProps } from '../../../../../Components/PageComponents/tools/schemaProps';
import { isServerMethod } from '../../../../../data/Reducer/globalState';
import { store } from '../../../../../data/Stores/store';
import {
  getVariableMethodConfig,
  MethodConfig,
  WegasMethod,
  WegasMethodParameter,
} from '../../../../editionConfig';
import { StringOrT } from '../../TreeVariableSelect';
import { handleError, isScriptCondition } from '../Script';
import { LiteralExpressionValue, parseStatement } from './astManagement';

export const comparisonOperators = {
  '!==': { label: 'not equals' },
  '===': { label: 'equals' },
  '>': { label: 'greater than' },
  '>=': { label: 'greater or equals than' },
  '<': { label: 'lesser than' },
  '<=': { label: 'lesser or equals than' },
} as const;

export type WegasOperators = keyof typeof comparisonOperators;

export function isWegasBooleanOperator(
  operator: string,
): operator is WegasOperators {
  return Object.keys(comparisonOperators).includes(operator);
}

export interface CommonExpressionAttributes {
  methodId?: string;
  arguments?: LiteralExpressionValue[];
}

export interface LiteralExpressionAttributes {
  type: 'literal';
  literal: LiteralExpressionValue;
}

export interface VariableExpressionAttributes {
  type: 'variable';
  variableName: string;
}

export interface GlobalExpressionAttributes {
  type: 'global';
  globalObject: string;
}

export interface ImpactAttributes extends CommonExpressionAttributes {
  type: 'impact';
  expression?: GlobalExpressionAttributes | VariableExpressionAttributes;
}

export interface ConditionAttributes extends CommonExpressionAttributes {
  type: 'condition';
  leftExpression?:
    | LiteralExpressionAttributes
    | GlobalExpressionAttributes
    | VariableExpressionAttributes;
  booleanOperator?: WegasOperators;
  rightExpression?: LiteralExpressionValue;
}

export type Attributes = ImpactAttributes | ConditionAttributes | undefined;

interface VariableCall {
  type: 'variable';
  variableName: string;
  script: string;
}

interface GlobalCall {
  type: 'global';
  script: string;
}

type CallItemValue = VariableCall | GlobalCall;

interface BooleanItemValue {
  type: 'boolean';
  script: 'true' | 'false';
}

export interface SelectOperator {
  label: string;
  value: WegasOperators;
}

type ScriptItemValue = CallItemValue | BooleanItemValue;

type ExpressionType = ScriptItemValue['type'];

export interface IParameterAttributes {
  [param: number]: unknown;
}

export interface IInitAttributes extends IParameterAttributes {
  initExpression: ScriptItemValue;
  variableName?: string;
}

const defaultBooleanAttributes: Partial<IInitAttributes> = {
  initExpression: undefined,
};

export const defaultInitAttributes: Partial<IInitAttributes> = {
  variableName: undefined,
  initExpression: undefined,
};

export interface IAttributes extends IInitAttributes {
  methodName: string;
}

const defaultAttributes: Partial<IAttributes> = {
  ...defaultInitAttributes,
  methodName: undefined,
};

export interface IConditionAttributes extends IAttributes {
  operator: WegasOperators;
  comparator: unknown;
}

export const defaultConditionAttributes: Partial<IConditionAttributes> = {
  ...defaultAttributes,
  operator: undefined,
  comparator: undefined,
};

export type PartialAttributes = Partial<
  IInitAttributes | IAttributes | IConditionAttributes
>;

export interface IParameterSchemaAtributes {
  [param: number]: WegasMethodParameter & {
    type: TYPESTRING;
    oldType: WegasTypeString;
  };
}

export type ImpactSchema = {
  [key in keyof Omit<ImpactAttributes, 'arguments'>]: AvailableSchemas;
} & { arguments?: Schema.Object<AvailableViews> };
export type ConditionSchema = {
  [key in keyof Omit<ConditionAttributes, 'arguments'>]: AvailableSchemas;
} & { arguments?: Schema.Object<AvailableViews> };

export type SchemaProperties = ImpactSchema | ConditionSchema;

export interface WyiswygExpressionSchema {
  description: string;
  properties: SchemaProperties;
}

function isFilledObject(defaultObject: object, comparedObject: object) {
  const defaultObjectKeys = Object.keys(defaultObject);
  const filtererdObject = pick(comparedObject, defaultObjectKeys);
  const objectKeys = Object.keys(filtererdObject);
  return (
    objectKeys.length === defaultObjectKeys.length &&
    Object.values(filtererdObject).every(v => v !== undefined)
  );
}

export function isBooleanExpression(
  scriptAttributes: PartialAttributes,
): scriptAttributes is IInitAttributes {
  return (
    isFilledObject(defaultBooleanAttributes, scriptAttributes) &&
    scriptAttributes.initExpression?.type === 'boolean'
  );
}

export function isAttributes(
  scriptAttributes: PartialAttributes,
): scriptAttributes is IAttributes {
  return isFilledObject(defaultAttributes, scriptAttributes);
}

export function isConditionAttributes(
  scriptAttributes: PartialAttributes,
): scriptAttributes is IConditionAttributes {
  return isFilledObject(defaultConditionAttributes, scriptAttributes);
}

function filterVariableMethods(
  methods: MethodConfig,
  mode?: ScriptMode,
): MethodConfig {
  return Object.keys(methods)
    .filter(k =>
      mode?.includes('GET')
        ? methods[k].returns !== undefined
        : methods[k].returns === undefined,
    )
    .reduce((o, k) => ({ ...o, [k]: methods[k] }), {});
}

function filterOperators(
  methodReturns: WegasMethod['returns'],
): SelectOperator[] {
  return Object.keys(comparisonOperators)
    .filter(k => methodReturns === 'number' || k === '===' || k === '!==')
    .map((k: WegasOperators) => ({
      label: comparisonOperators[k].label,
      value: k,
    }));
}

export function typeCleaner(
  variable: unknown,
  expectedType: WegasTypeString,
  defaultValue?: unknown,
) {
  const variableCurrentType = Array.isArray(variable)
    ? 'array'
    : typeof variable;
  if (variableCurrentType === expectedType) {
    return variable;
  } else if (typeof variable === 'undefined') {
    return variable;
  } else {
    switch (expectedType) {
      case 'boolean': {
        if (variableCurrentType === 'number') {
          return Boolean(variable);
        } else {
          return defaultValue;
        }
      }
      case 'number': {
        if (!isNaN(Number(variable))) {
          return Number(variable);
        } else {
          return defaultValue;
        }
      }
      case 'string': {
        if (
          variableCurrentType === 'number' ||
          variableCurrentType === 'boolean'
        ) {
          return String(variable);
        } else {
          return defaultValue;
        }
      }
      case 'null': {
        return defaultValue ? defaultValue : null;
      }
      case 'array': {
        return defaultValue ? defaultValue : [];
      }
      case 'object': {
        return defaultValue ? defaultValue : {};
      }
      default: {
        return defaultValue ? defaultValue : undefined;
      }
    }
  }
}

interface FullNameMethod extends ServerGlobalMethod {
  fullName: string;
}

function getServerMethods(
  serverObject: ServerGlobalObject | ServerGlobalMethod | undefined,
  path: string[] = [],
  methods: FullNameMethod[] = [],
): FullNameMethod[] {
  if (serverObject == null) {
    return methods;
  } else if (isServerMethod(serverObject)) {
    return [
      ...methods,
      {
        ...serverObject,
        fullName: path.join('.'),
      },
    ];
  } else {
    return [
      ...methods,
      ...Object.entries(serverObject).reduce((old, [objectName, value]) => {
        return [...old, ...getServerMethods(value, [...path, objectName])];
      }, []),
    ];
  }
}

function genGlobalItems<T = string>(
  mode?: ScriptMode,
  decorateFn?: (value: string) => T,
): TreeSelectItem<StringOrT<typeof decorateFn, T>>[] {
  return getServerMethods(store.getState().global.serverMethods)
    .filter(method =>
      isScriptCondition(mode)
        ? method.returns !== undefined
        : method.returns === undefined,
    )
    .map(method => {
      return {
        label: method.label,
        value: decorateFn ? decorateFn(method.fullName) : method.fullName,
      };
    });
}

function getGlobalMethodConfig(globalMethod: string): MethodConfig {
  const foundMethod = getServerMethods(
    store.getState().global.serverMethods,
  ).find(method => method.fullName === globalMethod);
  return foundMethod
    ? {
        [globalMethod]: {
          label: foundMethod.label,
          parameters: foundMethod.parameters as WegasMethodParameter[],
          returns: foundMethod.returns as WegasMethodReturnType,
        },
      }
    : {};
}

interface MethodSearcher {
  type: ExpressionType;
}
interface GlobalMethodSearcher extends MethodSearcher {
  type: 'global';
  value: string;
}
interface VariableMethodSearcher extends MethodSearcher {
  type: 'variable';
  value?: SVariableDescriptor;
  mode?: ScriptMode;
}
interface BooleanMethodSearcher extends MethodSearcher {
  type: 'boolean';
}
type MethodSearchers =
  | GlobalMethodSearcher
  | VariableMethodSearcher
  | BooleanMethodSearcher;

async function getMethodConfig(
  methodSearcher: MethodSearchers,
): Promise<MethodConfig> {
  switch (methodSearcher.type) {
    case 'global':
      return getGlobalMethodConfig(methodSearcher.value);
    case 'variable':
      return methodSearcher.value
        ? filterVariableMethods(
            await getVariableMethodConfig(methodSearcher.value),
            methodSearcher.mode,
          )
        : {};
    default:
      return {};
  }
}

export function makeItems(
  value: string,
  type: ExpressionType,
):
  | LiteralExpressionAttributes
  | GlobalExpressionAttributes
  | VariableExpressionAttributes {
  switch (type) {
    case 'boolean': {
      let parsed = true;
      try {
        parsed = JSON.parse(value);
        if (typeof parsed !== 'boolean') {
          parsed = false;
        }
      } catch (_e) {
        parsed = false;
      }
      return {
        type: 'literal',
        literal: parsed,
      };
    }
    case 'global': {
      return {
        type: 'global',
        globalObject: value,
      };
    }
    case 'variable': {
      return {
        type: 'variable',
        variableName: value,
      };
    }
  }
}

export function makeSchemaInitExpression(
  variablesItems:
    | TreeSelectItem<
        | string
        | LiteralExpressionAttributes
        | GlobalExpressionAttributes
        | VariableExpressionAttributes
      >[]
    | undefined,
  mode?: ScriptMode,
): SchemaProperties {
  const expressionSchema = schemaProps.tree({
    items: [
      {
        label: 'Variables',
        items: variablesItems,
        value: 'Variables',
        selectable: false,
      },
      ...(mode === 'GET' || mode === 'SET'
        ? [
            {
              label: 'Global methods',
              items: genGlobalItems(mode, value => makeItems(value, 'global')),
              value: 'Global methods',
              selectable: false,
            },
          ]
        : []),
      ...(isScriptCondition(mode)
        ? [
            {
              label: 'Booleans',
              items: [
                { label: 'True', value: makeItems('true', 'boolean') },
                { label: 'False', value: makeItems('false', 'boolean') },
              ],
              value: 'Booleans',
              selectable: false,
            },
          ]
        : []),
    ],
    type: 'object',
    layout: 'inline',
    borderBottom: true,
  });

  if (isScriptCondition(mode)) {
    return {
      type: schemaProps.hidden({ type: 'string', index: 1000 }),
      leftExpression: expressionSchema,
    };
  } else {
    return {
      type: schemaProps.hidden({ type: 'string', index: 1000 }),
      expression: expressionSchema,
    };
  }
}

function makeSchemaMethodSelector(methods?: MethodConfig) {
  return {
    ...(methods && Object.keys(methods).length > 0
      ? {
          methodId: schemaProps.select({
            values: Object.keys(methods).map(k => ({
              label: methods[k].label,
              value: k,
            })),
            returnType: 'string',
            index: 1,
            layout: 'inline',
          }),
        }
      : {}),
  };
}

function makeSchemaParameters(
  // index: number,
  parameters: WegasMethodParameter[],
): Schema.Object<AvailableViews> {
  return {
    type: 'object',
    view: {
      type: 'object',
    },
    properties: parameters.reduce<
      Record<string, AvailableSchemas & { oldType: WegasTypeString }>
    >((o, p, i) => {
      o[i] = {
        ...p,
        type: p.type === 'identifier' ? 'string' : p.type,
        oldType: p.type,
        view: {
          layout: 'shortInline',
          ...p.view,
        },
      };
      return o;
    }, {}),
  };
}

function makeSchemaConditionAttributes(
  index: number,
  method?: WegasMethod,
  mode?: ScriptMode,
): Pick<ConditionSchema, 'booleanOperator' | 'rightExpression'> | EmptyObject {
  return {
    ...(method && isScriptCondition(mode) && method.returns !== 'boolean'
      ? {
          booleanOperator: schemaProps.select({
            values: filterOperators(method.returns),
            returnType: 'string',
            index: method.parameters.length + index,
            layout: 'inline',
            required: true,
            value: {
              label: 'equals',
              value: '===',
            },
          }),
          rightExpression: schemaProps.custom({
            label: undefined,
            type: method.returns,
            viewType: method.returns,
            index: method.parameters.length + index,
            layout: 'inline',
            required: true,
            value: 0,
          }) as AvailableSchemas,
        }
      : {}),
  };
}

export async function generateSchema(
  attributes: Attributes,
  variablesItems:
    | TreeSelectItem<
        | string
        | LiteralExpressionAttributes
        | GlobalExpressionAttributes
        | VariableExpressionAttributes
      >[]
    | undefined,
  mode?: ScriptMode,
): Promise<WyiswygExpressionSchema> {
  let newSchemaProps = makeSchemaInitExpression(variablesItems, mode);
  const expression =
    attributes?.type === 'condition'
      ? attributes?.leftExpression
      : attributes?.expression;

  if (expression != null) {
    let configArg: MethodSearchers;
    switch (expression.type) {
      case 'global':
        configArg = { type: expression.type, value: expression.globalObject };
        break;
      case 'variable':
        configArg = {
          type: expression.type,
          value: safeClientScriptEval<SVariableDescriptor>(
            `Variable.find(gamemodel,${expression.variableName})`,
            undefined,
            undefined,
            undefined,
            undefined,
          ),
          mode,
        };
        break;
      default:
        configArg = { type: 'boolean' };
    }

    const methods = await getMethodConfig(configArg);
    let method: WegasMethod | undefined = undefined;
    switch (expression.type) {
      case 'global': {
        method = methods[expression.globalObject];
        break;
      }
      case 'variable': {
        const methodName = attributes?.methodId;
        if (methodName) {
          method = methods[methodName];
        }
        break;
      }
    }
    let propsIndex = 1;
    if (expression.type === 'variable') {
      propsIndex += 1;
      newSchemaProps = {
        ...newSchemaProps,
        ...makeSchemaMethodSelector(methods),
      };
    }

    if (method?.parameters) {
      newSchemaProps.arguments = makeSchemaParameters(method.parameters);
    }

    if (isScriptCondition(mode)) {
      newSchemaProps = {
        ...newSchemaProps,
        ...makeSchemaConditionAttributes(propsIndex, method, mode),
      };
    }
  }

  return {
    description: 'WyiswygExpression',
    properties: newSchemaProps,
  };
}

export function testCode(
  code: string,
  mode: ScriptMode | undefined,
): string | Attributes {
  let newStatement: Statement = emptyStatement();
  try {
    const statements = parse(code, {
      sourceType: 'script',
    }).program.body;

    if (statements.length <= 1) {
      if (statements.length === 0) {
        newStatement = emptyStatement();
      } else {
        newStatement = statements[0];
      }

      try {
        return parseStatement(newStatement, mode);
      } catch (e) {
        return String(e);
      }
    } else {
      return 'While multiple statements are detected, source mode is forced';
    }
  } catch (e) {
    return handleError(e);
  }
}
