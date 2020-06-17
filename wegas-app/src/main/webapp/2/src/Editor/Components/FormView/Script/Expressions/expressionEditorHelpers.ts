import {
  WegasMethodParameter,
  WegasTypeString,
  MethodConfig,
  WegasMethod,
  getVariableMethodConfig,
} from '../../../../editionConfig';

import { schemaProps } from '../../../../../Components/PageComponents/tools/schemaProps';

import { pick } from 'lodash-es';

import { ScriptMode, isScriptCondition } from '../Script';

import {
  StringOrT,
  genVarItems,
  TreeSelectItem,
} from '../../TreeVariableSelect';

import { store } from '../../../../../data/store';
import { TYPESTRING } from 'jsoninput/typings/types';
import { safeClientScriptEval } from '../../../../../Components/Hooks/useScript';

const booleanOperators = {
  '===': { label: 'equals' },
  '>': { label: 'greater than' },
  '>=': { label: 'greater or equals than' },
  '<': { label: 'lesser than' },
  '<=': { label: 'lesser or equals than' },
};

export type WegasOperators = keyof typeof booleanOperators;

export type ExpressionType = 'variable' | 'global' | 'boolean';

export interface SelectOperator {
  label: string;
  value: WegasOperators;
}

export interface ScriptItemValue {
  type: ExpressionType;
  script: string;
}

export interface IParameterAttributes {
  [param: number]: unknown;
}

export interface IInitAttributes extends IParameterAttributes {
  initExpression: ScriptItemValue;
  variableName?: string;
}

export const defaultInitAttributes: Partial<IInitAttributes> = {
  variableName: undefined,
  initExpression: undefined,
};

export interface IAttributes extends IInitAttributes {
  methodName: string;
}

export const defaultAttributes: Partial<IAttributes> = {
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
export interface IInitSchemaAttributes extends IParameterSchemaAtributes {
  initExpression: ReturnType<typeof schemaProps['tree']>;
}

export interface ISchemaAttributes extends IInitSchemaAttributes {
  methodName: ReturnType<typeof schemaProps['select']>;
}
export interface IConditionSchemaAttributes extends ISchemaAttributes {
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

export const isFilledObject = (
  defaultObject: object,
  comparedObject: object,
) => {
  const defaultObjectKeys = Object.keys(defaultObject);
  const filtererdObject = pick(comparedObject, defaultObjectKeys);
  const objectKeys = Object.keys(filtererdObject);
  return (
    objectKeys.length === defaultObjectKeys.length &&
    Object.values(filtererdObject).every(v => v !== undefined)
  );
};

export const isInitAttributes = (
  scriptAttributes: PartialAttributes,
): scriptAttributes is IInitAttributes =>
  isFilledObject(defaultInitAttributes, scriptAttributes);

export const isAttributes = (
  scriptAttributes: PartialAttributes,
): scriptAttributes is IAttributes =>
  isFilledObject(defaultAttributes, scriptAttributes);

export const isConditionAttributes = (
  scriptAttributes: PartialAttributes,
): scriptAttributes is IConditionAttributes =>
  isFilledObject(defaultConditionAttributes, scriptAttributes);

export const isInitSchemaAttributes = (
  scriptAttributes: PartialSchemaAttributes,
): scriptAttributes is IInitSchemaAttributes =>
  isFilledObject(defaultInitAttributes, scriptAttributes);

export const isSchemaAttributes = (
  scriptAttributes: PartialSchemaAttributes,
): scriptAttributes is ISchemaAttributes =>
  isFilledObject(defaultAttributes, scriptAttributes);

export const isConditionSchemaAttributes = (
  scriptAttributes: PartialSchemaAttributes,
): scriptAttributes is IConditionSchemaAttributes =>
  isFilledObject(defaultConditionAttributes, scriptAttributes);

export const filterVariableMethods = (
  methods: MethodConfig,
  mode?: ScriptMode,
): MethodConfig =>
  Object.keys(methods)
    .filter(k =>
      mode === 'GET'
        ? methods[k].returns !== undefined
        : methods[k].returns === undefined,
    )
    .reduce((o, k) => ({ ...o, [k]: methods[k] }), {});

export const filterOperators = (
  methodReturns: WegasMethod['returns'],
): SelectOperator[] =>
  Object.keys(booleanOperators)
    .filter(k => methodReturns === 'number' || k === '===')
    .map((k: WegasOperators) => ({
      label: booleanOperators[k].label,
      value: k,
    }));

export const typeCleaner = (
  variable: unknown,
  expectedType: WegasTypeString,
  required?: boolean,
  defaultValue?: unknown,
) => {
  const variableCurrentType = Array.isArray(variable)
    ? 'array'
    : typeof variable;
  if (variableCurrentType === expectedType) {
    return variable;
  } else if (typeof variable === 'undefined' && !required) {
    return variable;
  } else {
    switch (expectedType) {
      case 'boolean': {
        if (variableCurrentType === 'number') {
          return Boolean(variable);
        } else {
          return defaultValue ? defaultValue : required ? false : undefined;
        }
      }
      case 'number': {
        if (!isNaN(Number(variable))) {
          return Number(variable);
        } else {
          return defaultValue ? defaultValue : required ? 0 : undefined;
        }
      }
      case 'string': {
        if (
          variableCurrentType === 'number' ||
          variableCurrentType === 'boolean'
        ) {
          return String(variable);
        } else {
          return defaultValue ? defaultValue : required ? '' : undefined;
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
};

export function genGlobalItems<T = string>(
  mode?: ScriptMode,
  decorateFn?: (value: string) => T,
): TreeSelectItem<StringOrT<typeof decorateFn, T>>[] {
  return Object.entries(store.getState().global.serverMethods)
    .filter(
      ([_k, v]) =>
        v !== undefined &&
        (isScriptCondition(mode)
          ? v.returns !== undefined
          : v.returns === undefined),
    )
    .map(([k, v]) => ({
      label: v!.label,
      value: decorateFn ? decorateFn(k) : k,
    }));
}

export function getGlobalMethodConfig(globalMethod: string) {
  return {
    [globalMethod]: store.getState().global.serverMethods[globalMethod],
  } as MethodConfig;
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
  value?: IVariableDescriptor;
  mode?: ScriptMode;
}
interface BooleanMethodSearcher extends MethodSearcher {
  type: 'boolean';
}
export type MethodSearchers =
  | GlobalMethodSearcher
  | VariableMethodSearcher
  | BooleanMethodSearcher;

export async function getMethodConfig(
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

export const makeItems: (
  value: string,
  type: ExpressionType,
) => ScriptItemValue = (value, type) => ({
  type,
  script: type === 'variable' ? `Variable.find(gameModel,'${value}')` : value,
});

export const makeSchemaInitExpression = (
  variableIds: number[],
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
) => ({
  variableName: schemaProps.hidden(false, 'string', 1000),
  initExpression: schemaProps.tree(
    undefined,
    [
      {
        label: 'Variables',
        items: genVarItems(
          variableIds,
          undefined,
          scriptableClassFilter,
          value => makeItems(value, 'variable'),
        ),
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
    false,
    undefined,
    'object',
    'DEFAULT',
    0,
    'inline',
  ),
});

export const makeSchemaMethodSelector = (methods?: MethodConfig) => ({
  ...(methods && Object.keys(methods).length > 0
    ? {
        methodName: schemaProps.select(
          undefined,
          false,
          Object.keys(methods).map(k => ({
            label: methods[k].label,
            value: k,
          })),
          'string',
          undefined,
          undefined,
          'DEFAULT',
          1,
          'inline',
        ),
      }
    : {}),
});

export const makeSchemaParameters = (
  index: number,
  parameters: WegasMethodParameter[],
) =>
  parameters.reduce(
    (o, p, i) => ({
      ...o,
      [i]: {
        ...p,
        index: index + i,
        type: p.type === 'identifier' ? 'string' : p.type,
        oldType: p.type,
        view: {
          // label: i + ' ' + JSON.stringify(p.view),
          ...p.view,
          index: index + i,
          //layout: 'inline',
        },
      },
    }),
    {},
  );

export const makeSchemaConditionAttributes = (
  index: number,
  method?: WegasMethod,
  mode?: ScriptMode,
) => ({
  ...(method && isScriptCondition(mode) && method.returns !== 'boolean'
    ? {
        operator: schemaProps.select(
          undefined,
          false,
          filterOperators(method.returns),
          'string',
          undefined,
          undefined,
          'DEFAULT',
          method.parameters.length + index,
          'inline',
        ),
        comparator: schemaProps.custom(
          undefined,
          false,
          method.returns,
          method.returns,
          undefined,
          method.parameters.length + index,
          'inline',
        ),
      }
    : {}),
});

export const makeGlobalMethodSchema = (
  variableIds: number[],
  scriptMethod?: WegasMethod,
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
): {
  description: string;
  properties: IInitSchemaAttributes;
} => ({
  description: 'GlobalMethodSchema',
  properties: {
    ...makeSchemaInitExpression(variableIds, mode, scriptableClassFilter),
    ...(scriptMethod ? makeSchemaParameters(1, scriptMethod.parameters) : {}),
  },
});

export const makeVariableMethodSchema = (
  variableIds: number[],
  methods?: MethodConfig,
  scriptMethod?: WegasMethod,
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
): WyiswygExpressionSchema => ({
  description: 'VariableMethodSchema',
  properties: {
    ...makeSchemaInitExpression(variableIds, mode, scriptableClassFilter),
    ...makeSchemaMethodSelector(methods),
    ...(scriptMethod ? makeSchemaParameters(2, scriptMethod.parameters) : {}),
    ...makeSchemaConditionAttributes(2, scriptMethod, mode),
  },
});

export const generateSchema = async (
  attributes: PartialAttributes,
  variableIds: number[],
  mode?: ScriptMode,
): Promise<WyiswygExpressionSchema> => {
  let newSchemaProps:
    | IInitSchemaAttributes
    | ISchemaAttributes
    | IConditionSchemaAttributes = {
    ...makeSchemaInitExpression(variableIds, mode),
  };

  if (attributes.initExpression) {
    const type = attributes.initExpression.type;
    const script = attributes.initExpression.script;
    const variable = safeClientScriptEval<IVariableDescriptor>(script);
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
};
