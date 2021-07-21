import {
  WegasMethodParameter,
  MethodConfig,
  WegasMethod,
  getVariableMethodConfig,
} from '../../../../editionConfig';

import { schemaProps } from '../../../../../Components/PageComponents/tools/schemaProps';

import { pick } from 'lodash-es';

import { isScriptCondition } from '../Script';

import { StringOrT } from '../../TreeVariableSelect';

import { store } from '../../../../../data/Stores/store';
import { TYPESTRING } from 'jsoninput/typings/types';
import { safeClientScriptEval } from '../../../../../Components/Hooks/useScript';
import { isServerMethod } from '../../../../../data/Reducer/globalState';
import { SVariableDescriptor } from 'wegas-ts-api';

const booleanOperators = {
  '===': { label: 'equals' },
  '>': { label: 'greater than' },
  '>=': { label: 'greater or equals than' },
  '<': { label: 'lesser than' },
  '<=': { label: 'lesser or equals than' },
};

export type WegasOperators = keyof typeof booleanOperators;

interface CallItemValue {
  type: 'variable' | 'global';
  script: string;
}

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
interface IInitSchemaAttributes extends IParameterSchemaAtributes {
  initExpression: ReturnType<typeof schemaProps['tree']>;
}

interface ISchemaAttributes extends IInitSchemaAttributes {
  methodName: ReturnType<typeof schemaProps['select']>;
}
interface IConditionSchemaAttributes extends ISchemaAttributes {
  operator: ReturnType<typeof schemaProps['select']>;
  comparator: ReturnType<typeof schemaProps['custom']>;
}
export type PartialSchemaAttributes = Partial<
  IInitSchemaAttributes | ISchemaAttributes | IConditionSchemaAttributes
>;
export interface WyiswygExpressionSchema {
  description: string;
  properties: PartialSchemaAttributes;
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

export function isInitSchemaAttributes(
  scriptAttributes: PartialSchemaAttributes,
): scriptAttributes is IInitSchemaAttributes {
  return isFilledObject(defaultInitAttributes, scriptAttributes);
}

export function isConditionSchemaAttributes(
  scriptAttributes: PartialSchemaAttributes,
): scriptAttributes is IConditionSchemaAttributes {
  return isFilledObject(defaultConditionAttributes, scriptAttributes);
}

function filterVariableMethods(
  methods: MethodConfig,
  mode?: ScriptMode,
): MethodConfig {
  return Object.keys(methods)
    .filter(k =>
      mode === 'GET'
        ? methods[k].returns !== undefined
        : methods[k].returns === undefined,
    )
    .reduce((o, k) => ({ ...o, [k]: methods[k] }), {});
}

function filterOperators(
  methodReturns: WegasMethod['returns'],
): SelectOperator[] {
  return Object.keys(booleanOperators)
    .filter(k => methodReturns === 'number' || k === '===')
    .map((k: WegasOperators) => ({
      label: booleanOperators[k].label,
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
    return [...methods, { ...serverObject, fullName: path.join('.') }];
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
): ScriptItemValue {
  return type === 'variable'
    ? {
        type,
        script: `Variable.find(gameModel,'${value}')`,
      }
    : type === 'global'
    ? {
        type,
        script: value,
      }
    : {
        type,
        script: value as BooleanItemValue['script'],
      };
}

function makeSchemaInitExpression(
  variablesItems: TreeSelectItem<string | ScriptItemValue>[] | undefined,
  mode?: ScriptMode,
) {
  return {
    variableName: schemaProps.hidden({ type: 'string', index: 1000 }),
    initExpression: schemaProps.tree({
      items: [
        {
          label: 'Variables',
          items: variablesItems,
          value: 'Variables',
          selectable: false,
        },
        {
          label: 'Global methods',
          items: genGlobalItems(mode, value => makeItems(value, 'global')),
          value: 'Global methods',
          selectable: false,
        },
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
    }),
  };
}

function makeSchemaMethodSelector(methods?: MethodConfig) {
  return {
    ...(methods && Object.keys(methods).length > 0
      ? {
          methodName: schemaProps.select({
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
  index: number,
  parameters: WegasMethodParameter[],
) {
  return parameters.reduce(
    (o, p, i) => ({
      ...o,
      [i]: {
        ...p,
        index: index + i,
        type: p.type === 'identifier' ? 'string' : p.type,
        oldType: p.type,
        view: {
          ...p.view,
          index: index + i,
        },
      },
    }),
    {},
  );
}

function makeSchemaConditionAttributes(
  index: number,
  method?: WegasMethod,
  mode?: ScriptMode,
) {
  return {
    ...(method && isScriptCondition(mode) && method.returns !== 'boolean'
      ? {
          operator: schemaProps.select({
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
          comparator: schemaProps.custom({
            label: undefined,
            type: method.returns,
            viewType: method.returns,
            index: method.parameters.length + index,
            layout: 'inline',
            required: true,
            value: 0,
          }),
        }
      : {}),
  };
}

export async function generateSchema(
  attributes: PartialAttributes,
  variablesItems: TreeSelectItem<string | ScriptItemValue>[] | undefined,
  mode?: ScriptMode,
): Promise<WyiswygExpressionSchema> {
  let newSchemaProps:
    | IInitSchemaAttributes
    | ISchemaAttributes
    | IConditionSchemaAttributes = {
    ...makeSchemaInitExpression(variablesItems, mode),
  };

  if (attributes.initExpression) {
    const type = attributes.initExpression.type;
    const script = attributes.initExpression.script;
    const variable = safeClientScriptEval<SVariableDescriptor>(script);
    let configArg: MethodSearchers;
    switch (type) {
      case 'global':
        configArg = { type, value: script };
        break;
      case 'variable':
        configArg = { type, value: variable, mode };
        break;
      default:
        configArg = { type };
    }

    const methods = await getMethodConfig(configArg);
    let method: WegasMethod | undefined = undefined;
    switch (type) {
      case 'global': {
        method = methods[script];
        break;
      }
      case 'variable': {
        const methodName = (attributes as IAttributes).methodName;
        if (methodName) {
          method = methods[methodName];
        }
        break;
      }
    }
    let propsIndex = 1;
    if (type === 'variable') {
      propsIndex += 1;
      newSchemaProps = {
        ...newSchemaProps,
        ...makeSchemaMethodSelector(methods),
      };
    }

    newSchemaProps = {
      ...newSchemaProps,
      ...(method ? makeSchemaParameters(propsIndex, method.parameters) : {}),
      ...makeSchemaConditionAttributes(propsIndex, method, mode),
    };
  }

  return {
    description: 'WyiswygExpression',
    properties: newSchemaProps,
  };
}
