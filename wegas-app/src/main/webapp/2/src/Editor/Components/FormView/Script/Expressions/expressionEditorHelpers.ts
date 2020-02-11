import {
  WegasMethodParameter,
  WegasTypeString,
  MethodConfig,
  WegasMethod,
} from '../../../../editionConfig';

import { schemaProps } from '../../../../../Components/PageComponents/tools/schemaProps';

import { pick } from 'lodash-es';

import { ScriptMode, isScriptCondition } from '../Script';

import { Item } from '../../../Tree/TreeSelect';

import { StringOrT, genVarItems } from '../../TreeVariableSelect';

import { store } from '../../../../../data/store';
import { TYPESTRING } from 'jsoninput/typings/types';

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
}

export const defaultInitAttributes: Partial<IInitAttributes> = {
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
export interface IUnknownSchema {
  description: string;
  properties: IParameterSchemaAtributes;
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
  scriptAttributes: IParameterAttributes,
): scriptAttributes is IInitAttributes =>
  isFilledObject(defaultInitAttributes, scriptAttributes);

export const isAttributes = (
  scriptAttributes: IParameterAttributes,
): scriptAttributes is IAttributes =>
  isFilledObject(defaultAttributes, scriptAttributes);

export const isConditionAttributes = (
  scriptAttributes: IParameterAttributes,
): scriptAttributes is IConditionAttributes =>
  isFilledObject(defaultConditionAttributes, scriptAttributes);

export const isInitSchemaAttributes = (
  scriptAttributes: IParameterSchemaAtributes,
): scriptAttributes is IInitSchemaAttributes =>
  isFilledObject(defaultInitAttributes, scriptAttributes);

export const isSchemaAttributes = (
  scriptAttributes: IParameterSchemaAtributes,
): scriptAttributes is ISchemaAttributes =>
  isFilledObject(defaultAttributes, scriptAttributes);

export const isConditionSchemaAttributes = (
  scriptAttributes: IParameterSchemaAtributes,
): scriptAttributes is IConditionSchemaAttributes =>
  isFilledObject(defaultConditionAttributes, scriptAttributes);

export const filterMethods = (
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
  const variableCurrentType = typeof variable;
  if (variableCurrentType === expectedType) {
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
      default: {
        return defaultValue ? defaultValue : undefined;
      }
    }
  }
};

export function genGlobalItems<T = string>(
  mode?: ScriptMode,
  decorateFn?: (value: string) => T,
): Item<StringOrT<typeof decorateFn, T>>[] {
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
  return store.getState().global.serverMethods[globalMethod];
}

export const makeItems: (
  value: string,
  type: ExpressionType,
) => ScriptItemValue = (value, type) => ({
  type,
  script: type === 'global' ? value : `Variable.find(gameModel,'${value}')`,
});

export const makeSchemaInitExpression = (
  variableIds: number[],
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
) => ({
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
      {
        label: 'Booleans',
        items: [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ],
        value: 'Booleans',
        selectable: false,
      },
    ],
    false,
    undefined,
    'object',
    'DEFAULT',
    0,
    'inline',
  ),
});

export const makeSchemaParameters = (
  parameters: WegasMethodParameter[],
  index: number,
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
          ...p.view,
          index: index + i,
          layout: 'inline',
        },
      },
    }),
    {},
  );

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
    ...(scriptMethod ? makeSchemaParameters(scriptMethod.parameters, 1) : {}),
  },
});

export const makeVariableMethodSchema = (
  variableIds: number[],
  methods?: MethodConfig,
  scriptMethod?: WegasMethod,
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
): IUnknownSchema => ({
  description: 'VariableMethodSchema',
  properties: {
    ...makeSchemaInitExpression(variableIds, mode, scriptableClassFilter),
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
            'DEFAULT',
            1,
            'inline',
          ),
        }
      : {}),
    ...(scriptMethod ? makeSchemaParameters(scriptMethod.parameters, 2) : {}),
    ...(scriptMethod && isScriptCondition(mode)
      ? {
          operator: schemaProps.select(
            undefined,
            false,
            filterOperators(scriptMethod.returns),
            'string',
            'DEFAULT',
            scriptMethod.parameters.length + 2,
            'inline',
          ),
          comparator: schemaProps.custom(
            undefined,
            false,
            scriptMethod.returns,
            scriptMethod.returns,
            undefined,
            scriptMethod.parameters.length + 3,
            'inline',
          ),
        }
      : {}),
  },
});
