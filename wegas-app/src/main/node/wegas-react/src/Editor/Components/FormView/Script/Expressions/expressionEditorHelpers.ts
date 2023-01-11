import { parse } from '@babel/parser';
import { emptyStatement, Statement } from '@babel/types';
import { Schema } from 'jsoninput/typings/types';
import { AvailableSchemas, AvailableViews } from '../..';
import { schemaProps } from '../../../../../Components/PageComponents/tools/schemaProps';
import { isServerMethod } from '../../../../../data/Reducer/globalState';
import { store } from '../../../../../data/Stores/store';
import {
  getVariableMethodConfig,
  MethodsConfig,
  MethodConfig,
  WegasMethodParameter,
} from '../../../../editionConfig';
import { StringOrT } from '../../TreeVariableSelect';
import { handleError, isClientMode, isScriptCondition, isServerScript } from '../Script';
import { LiteralExpressionValue, parseStatement } from './astManagement';
import { VariableDescriptor as VDSelect } from '../../../../../data/selectors';


const comparisonOperators = {
  isTrue: { label: 'is true' },
  isFalse: { label: 'is not true' },
  '===': { label: 'equals' },
  '!==': { label: 'not equals' },
  '>': { label: 'greater than' },
  '>=': { label: 'greater or equals than' },
  '<': { label: 'less than' },
  '<=': { label: 'less or equals than' },
} as const;

const comparisonOperatorTypes : Record<WegasMethodReturnType, WegasOperators[]> = 
{
  string: ['===', '!=='],
  number: ['===', '!==', '<', '<=', '>', '>='],
  boolean: ['isTrue', 'isFalse'],
}

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

interface LiteralExpressionAttributes {
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

export type LeftExpressionAttributes =
  | LiteralExpressionAttributes
  | GlobalExpressionAttributes
  | VariableExpressionAttributes;

export interface ConditionAttributes extends CommonExpressionAttributes {
  type: 'condition';
  leftExpression?: LeftExpressionAttributes;
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

interface SelectOperator {
  label: string;
  value: WegasOperators;
}

type ScriptItemValue = CallItemValue | BooleanItemValue;

type ExpressionType = ScriptItemValue['type'];

type ImpactSchema = {
  [key in keyof Omit<ImpactAttributes, 'arguments'>]: AvailableSchemas;
} & { arguments?: Schema.Object<AvailableViews & { oldType: string }> };
type ConditionSchema = {
  [key in keyof Omit<ConditionAttributes, 'arguments'>]: AvailableSchemas;
} & { arguments?: Schema.Object<AvailableViews & { oldType: string }> };

type SchemaProperties = ImpactSchema | ConditionSchema;

export interface WysiwygExpressionSchema {
  description: string;
  properties: SchemaProperties;
}

function filterVariableMethods(
  methods: MethodsConfig,
  mode?: ScriptMode,
): MethodsConfig {
  return Object.keys(methods)
    .filter(k =>
      mode?.includes('GET')
        ? methods[k].returns !== undefined
        : methods[k].returns === undefined,
    )
    .reduce((o, k) => ({ ...o, [k]: methods[k] }), {});
}

function generateOperators(
  methodReturns: MethodConfig['returns'],
): SelectOperator[] {

  if(methodReturns){
    const operators = comparisonOperatorTypes[methodReturns];
    return operators.map((k) => {
      return {
        label: comparisonOperators[k].label,
        value: k
      }
    }
    );
  }
  return [];

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
    return defaultValue != null ? defaultValue : variable;
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

function getGlobalMethodConfig(globalMethod: string): MethodsConfig {
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
  value?: IVariableDescriptor;
  mode?: ScriptMode;
}
interface BooleanMethodSearcher extends MethodSearcher {
  type: 'boolean';
}
type MethodSearchers =
  | GlobalMethodSearcher
  | VariableMethodSearcher
  | BooleanMethodSearcher;

function getMethodConfig(
  methodSearcher: MethodSearchers,
): MethodsConfig {
  switch (methodSearcher.type) {
    case 'global':
      return getGlobalMethodConfig(methodSearcher.value);
    case 'variable':
      return methodSearcher.value
        ? filterVariableMethods(
            getVariableMethodConfig(methodSearcher.value),
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
): LeftExpressionAttributes {
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

function variableScriptFactory(
  value: LeftExpressionAttributes,
): string | undefined {
  if (typeof value === 'object' && value.type === 'variable') {
    return `Variable.find(gameModel,'${value.variableName}')`;
  }
}

function makeSchemaInitExpression(
  variablesItems:
    | TreeSelectItem<string | LeftExpressionAttributes>[]
    | undefined,
  mode?: ScriptMode,
): SchemaProperties {
  const expressionSchema = schemaProps.tree({
    variableScriptFactory,
    items: [
      {
        label: 'Variables',
        items: variablesItems,
        value: 'Variables',
        selectable: false,
      },
      ...(isServerScript(mode)
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

function makeSchemaMethodSelector(methods?: MethodsConfig) {
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
            layout: 'longInline',
          }),
        }
      : {}),
  };
}

function makeSchemaParameters(
  parameters: WegasMethodParameter[],
): Schema.Object<AvailableViews & { oldType: string }> {
  return {
    type: 'object',
    index: 2,
    view: {
      type: 'object',
      oldType: 'object',
    },
    properties: parameters.reduce<
      Record<
        string,
        AvailableSchemas & { view: AvailableViews & { oldType: string } }
      >
    >((o, p, i) => {
      o[i] = {
        ...p,
        index: i,
        type: p.type === 'identifier' ? 'string' : p.type,
        view: {
          layout: 'shortInline',
          oldType: p.type,
          ...p.view,
        },
      };
      return o;
    }, {}),
  };
}

function defaultRightExpressionValue(method: MethodConfig) {
  switch (method.returns) {
    case 'boolean':
      return true;
    case 'number':
      return 0;
    case 'string':
      return '';
    default:
      return undefined;
  }
}

function isBooleanOperatorVisible(
  schema: SchemaProperties | undefined,
  attributes: Attributes,
): boolean {
  // We are forced to check if the getValue method is renamed is true,
  // In this case, do not add boolean comparison attributes
  // A best way to do that is to duplicate getValue for BooleanDescriptor
  // and offer getValue, isTrue, isFalse so we know we just need avoid comparison for isTrue and isFalse methods
  if (schema?.methodId != null && schema.methodId.view != null) {
    const choices = (
      schema.methodId.view as {
        choices: { label: string; value: string }[];
      }
    ).choices;
    const selectedChoice = choices.find(
      choice => choice.value === attributes?.methodId,
    );
    if (
      selectedChoice != null &&
      selectedChoice.value === attributes?.methodId
    ) {
      if (
        selectedChoice.value === 'getValue' &&
        selectedChoice.label === 'is true'
      ) {
        return false;
      }
    }
  }

  return (
    attributes?.type === 'condition' &&
    attributes.methodId !== 'isTrue' &&
    attributes.methodId !== 'isFalse'
  );
}

function isRightExpressionVisible(
  schema: SchemaProperties | undefined,
  attributes: Attributes,
) {
  return (
    isBooleanOperatorVisible(schema, attributes) &&
    attributes?.type === 'condition' &&
    attributes.booleanOperator !== 'isTrue' &&
    attributes.booleanOperator !== 'isFalse'
  );
}

function makeSchemaConditionAttributes(
  currentSchema: SchemaProperties,
  method?: MethodConfig,
): SchemaProperties {
  const conditionAttributesSchema:
    | Pick<ConditionSchema, 'booleanOperator' | 'rightExpression'>
    | EmptyObject = {};
  if (method) {
    conditionAttributesSchema['booleanOperator'] = schemaProps.select({
      values: generateOperators(method.returns),
      returnType: 'string',
      index: 3,
      layout: 'longInline',
      required: true,
      value: method.returns === 'boolean' ? 'isTrue' : '===',
      visible: (_value: LiteralExpressionValue, formValue: Attributes) =>
        isBooleanOperatorVisible(currentSchema, formValue),
    });

    conditionAttributesSchema['rightExpression'] = schemaProps.custom({
      label: undefined,
      type: method.returns,
      viewType: method.returns,
      value: defaultRightExpressionValue(method),
      index: 4,
      layout: 'longInline',
      required: true,
      visible: (_value: LiteralExpressionValue, formValue: Attributes) =>
        isRightExpressionVisible(currentSchema, formValue),
    }) as AvailableSchemas;
  }
  return {
    ...currentSchema,
    ...conditionAttributesSchema,
  };
}

export function generateSchema(
  attributes: Attributes,
  variablesItems:
    | TreeSelectItem<string | LeftExpressionAttributes>[]
    | undefined,
  mode?: ScriptMode,
): WysiwygExpressionSchema {
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
          value: VDSelect.findByName(expression.variableName),
          mode,
        };
        break;
      default:
        configArg = { type: 'boolean' };
    }
    const methods = getMethodConfig(configArg);
    let method: MethodConfig | undefined = undefined;
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
    if (expression.type === 'variable') {
      newSchemaProps = {
        ...newSchemaProps,
        ...makeSchemaMethodSelector(methods),
      };
    }

    if (method?.parameters) {
      newSchemaProps.arguments = makeSchemaParameters(method.parameters);
    }

    if (isScriptCondition(mode)) {
      newSchemaProps = makeSchemaConditionAttributes(
        newSchemaProps,
        method,
      );
    }
  }

  return {
    description: 'WyiswygExpression',
    properties: newSchemaProps,
  };
}

export function removeFinalSemicolon(code: string | undefined) {
  return code?.replace(/;$/, '');
}

export function isCodeEqual(
  codeA: string | undefined,
  codeB: string | undefined,
) {
  return removeFinalSemicolon(codeA) === removeFinalSemicolon(codeB);
}

export function parseCode(
  code: string,
  mode: ScriptMode | undefined,
): string | Attributes {
  let newStatement: Statement = emptyStatement();
  try {
    const statements = parse(code, {
      sourceType: isClientMode(mode) ? 'module' : 'script',
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
      return 'When multiple statements are detected, source mode is forced';
    }
  } catch (e) {
    return handleError(e);
  }
}

export function isExpressionValid(
  attributes: Attributes,
  schema: WysiwygExpressionSchema | undefined,
): boolean {
  if (attributes == null) {
    return false;
  } else if (
    schema?.properties.arguments?.properties != null &&
    Object.keys(schema?.properties.arguments?.properties).length !==
      attributes.arguments?.length
  ) {
    //arguments don't match expected scheme
    return false;
  } else if (attributes.type === 'impact') {
    if (
      attributes.expression == null ||
      (attributes.expression.type === 'variable' &&
        attributes.methodId === null)
    ) {
      return false;
    }
  } else if (attributes.type === 'condition') {
    if(attributes.leftExpression?.type === 'literal' && attributes.leftExpression.literal != null){
      return true;
    }
    if (
      attributes.leftExpression == null ||
      (attributes.leftExpression.type === 'variable' && attributes.methodId === null) ||
      (isBooleanOperatorVisible(schema?.properties, attributes) && attributes.booleanOperator == null) ||
      (isRightExpressionVisible(schema?.properties, attributes) && attributes.rightExpression == null)
    ) {
      return false;
    }
  }
  return true;
}
