import * as React from 'react';
import {
  Statement,
  Expression,
  CallExpression,
  StringLiteral,
  BinaryExpression,
  Literal,
  NumericLiteral,
  isCallExpression,
  isMemberExpression,
  isIdentifier,
  isBinaryExpression,
  isExpressionStatement,
  isEmptyStatement,
  expressionStatement,
  nullLiteral,
  stringLiteral,
  identifier,
  booleanLiteral,
  numericLiteral,
  callExpression,
  memberExpression,
  binaryExpression,
  BooleanLiteral,
  NullLiteral,
  Identifier,
  ObjectExpression,
  objectExpression,
  objectProperty,
} from '@babel/types';
import generate from '@babel/generator';
import {
  ScriptView,
  scriptIsCondition as isScriptCondition,
  scriptEditStyle,
  returnTypes,
  ScriptMode,
} from './Script';
import {
  getMethodConfig,
  WegasMethod,
  WegasTypeString,
  WegasMethodParameter,
  MethodConfig,
  WegasMethodReturnType,
  isWegasMethodReturnType,
} from '../../../editionConfig';
import { schemaProps } from '../../../../Components/PageComponents/tools/schemaProps';
import Form from 'jsoninput';
import { css } from 'emotion';
import { WegasScriptEditor } from '../../ScriptEditors/WegasScriptEditor';
import { parse } from '@babel/parser';
import { omit } from 'lodash';
import { IconButton } from '../../../../Components/Inputs/Button/IconButton';
import { MessageString } from '../../MessageString';
import { TYPESTRING, WidgetProps } from 'jsoninput/typings/types';
import { themeVar } from '../../../../Components/Theme';
import { GameModel } from '../../../../data/selectors';
import { isStatement } from '@babel/types';
import { CommonView, CommonViewContainer } from '../commonView';
import { LabeledView, Labeled } from '../labeled';
import { SCRIPTS, getGlobalMethodConfig } from './globalMethods';
import { genVarItems, StringOrT } from '../TreeVariableSelect';
import { useStore } from '../../../../data/store';
import { safeClientTSScriptEval } from '../../../../Components/Hooks/useScript';
import { Item } from '../../Tree/TreeSelect';
import { pick } from 'lodash-es';

const expressionEditorStyle = css({
  backgroundColor: themeVar.primaryHoverColor,
  marginTop: '0.8em',
  padding: '2px',
  div: {
    marginTop: '0',
  },
});

const isLiteralExpression = (expression: Expression): expression is Literal =>
  (isIdentifier(expression) && expression.name === 'undefined') ||
  expression.type === 'BooleanLiteral' ||
  expression.type === 'NullLiteral' ||
  expression.type === 'NumericLiteral' ||
  expression.type === 'StringLiteral';

const isVariableObject = (expression: Expression) =>
  isIdentifier(expression) && expression.name === 'Variable';
const isFindProperty = (expression: Expression) =>
  isIdentifier(expression) && expression.name === 'find';

// Variable setter methods
type ImpactExpression = CallExpression & {
  callee: {
    object: {
      arguments: {
        value: string;
      }[];
    };
    property: {
      name: string;
    };
  };
  arguments: Expression[];
};

type ImpactStatement = Statement & {
  expression: ImpactExpression;
};

const isImpactStatement = (
  statement: Expression | Statement,
): statement is ImpactStatement =>
  isExpressionStatement(statement) &&
  isCallExpression(statement.expression) &&
  isMemberExpression(statement.expression.callee) &&
  isCallExpression(statement.expression.callee.object) &&
  isMemberExpression(statement.expression.callee.object.callee) &&
  isVariableObject(statement.expression.callee.object.callee.object) &&
  isFindProperty(statement.expression.callee.object.callee.property);
// statement.expression.callee.object.arguments.length === 2;
const getVariable = (expression: ImpactExpression) =>
  expression.callee.object.arguments[1].value;
const getMethodName = (expression: ImpactExpression) =>
  expression.callee.property.name;

const listToObject: <T>(list: T[]) => { [id: string]: T } = list =>
  list.reduce((o, p, i) => ({ ...o, [i]: p }), {});

const getParameters = (expression: CallExpression) =>
  listToObject(
    expression.arguments.map(a => {
      switch (a.type) {
        case 'StringLiteral':
          return (a as StringLiteral).value;
        case 'NumericLiteral':
          return (a as NumericLiteral).value;
        default: {
          const code = generate(a).code;
          try {
            return JSON.parse(code);
          } catch {
            return code;
          }
        }
      }
    }),
  );

// Condition methods
type ConditionExpression = BinaryExpression & {
  left: CallExpression & ImpactExpression;
  right: {
    value: unknown;
  };
  operator: WegasOperators;
};

type ConditionStatement = Statement & {
  expression: ConditionExpression;
};
const isConditionStatement = (
  statement: Statement,
): statement is ConditionStatement =>
  isExpressionStatement(statement) &&
  isBinaryExpression(statement.expression) &&
  isImpactStatement({
    ...statement,
    type: 'ExpressionStatement',
    expression: statement.expression.left,
  }) &&
  isLiteralExpression(statement.expression.right);
const getOperator = (expression: ConditionExpression) => expression.operator;
const getComparator = (expression: ConditionExpression) =>
  expression.right.value;

const variableToASTNode = (
  variable: unknown,
  type?: WegasTypeString | WegasTypeString[],
  tolerateTypeVariation?: boolean,
):
  | BooleanLiteral
  | Identifier
  | NullLiteral
  | NumericLiteral
  | ObjectExpression
  | StringLiteral => {
  let usedType;
  if (type === undefined) {
    usedType = typeof variable;
  } else if (Array.isArray(type)) {
    if (type.includes(typeof variable as WegasTypeString)) {
      usedType = typeof variable as WegasTypeString;
    } else if (type.includes('identifier') && typeof variable === 'string') {
      usedType = 'identifier';
    } else if (tolerateTypeVariation) {
      if (type.length > 0) {
        usedType = typeof variable;
      } else {
        usedType = typeof variable;
      }
    } else {
      throw Error(
        `The current variable (${typeof variable}) type doesn't match the allowed types (${JSON.stringify(
          type,
        )})`,
      );
    }
  } else {
    if (typeof variable === type) {
      usedType = type;
    } else if (typeof variable === 'string' && type === 'identifier') {
      usedType = 'identifier';
    } else if (tolerateTypeVariation) {
      usedType = typeof variable;
    } else {
      throw Error(
        `The current variable (${typeof variable}) type doesn't match the allowed type (${type})`,
      );
    }
  }
  switch (usedType) {
    case 'array':
      throw Error(`Array type for method arguments not implemented yet`);
    case 'boolean':
      return booleanLiteral(variable as boolean);
    case 'identifier':
      return identifier(variable as string);
    case 'null':
      return nullLiteral();
    case 'number':
      return numericLiteral(variable as number);
    case 'string':
      return stringLiteral(variable as string);
    case 'object': {
      const objVariable = variable as object;
      return objectExpression(
        Object.keys(objVariable).map((k: keyof typeof objVariable) =>
          objectProperty(stringLiteral(k), variableToASTNode(objVariable[k])),
        ),
      );
    }
    default:
      throw Error(
        `Type ${typeof variable} for method arguments not implemented yet`,
      );
  }
};

const generateExpressionWithInitValue = (value: string) => {
  const parsedStatements = parse(value, {
    sourceType: 'script',
  }).program.body;
  if (parsedStatements.length > 0) {
    const parsedStatement = parsedStatements[0];
    if (isExpressionStatement(parsedStatement)) {
      const parsedExpression = parsedStatement.expression;
      if (isCallExpression(parsedExpression)) {
        return parsedExpression;
      }
    }
  }
  return callExpression();
};

const generateImpactExpression = (
  scriptAttributes: IForcedAttributes,
  schemaAttributes: IArgumentSchemaAtributes,
  tolerateTypeVariation?: boolean,
) => {
  return callExpression(
    memberExpression(
      generateExpressionWithInitValue(scriptAttributes.initExpression.script),
      identifier(scriptAttributes.methodName),
    ),
    Object.keys(
      omit(scriptAttributes, Object.keys(defaultConditionAttributes)),
    ).map(arg =>
      variableToASTNode(
        scriptAttributes[Number(arg)],
        schemaAttributes[Number(arg)].oldType,
        tolerateTypeVariation,
      ),
    ),
  );
};

const generateConditionStatement = (
  scriptAttributes: IForcedConditionAttributes,
  schemaAttributes: IArgumentSchemaAtributes,
  methodReturn: WegasMethodReturnType,
  tolerateTypeVariation?: boolean,
) => {
  return expressionStatement(
    binaryExpression(
      scriptAttributes.operator,
      generateImpactExpression(
        scriptAttributes,
        schemaAttributes,
        tolerateTypeVariation,
      ),
      variableToASTNode(
        scriptAttributes.comparator,
        methodReturn,
        tolerateTypeVariation,
      ),
    ),
  );
};

const booleanOperators = {
  '===': { label: 'equals' },
  '>': { label: 'greater than' },
  '>=': { label: 'greater or equals than' },
  '<': { label: 'lesser than' },
  '<=': { label: 'lesser or equals than' },
};

type WegasOperators = keyof typeof booleanOperators;

const filterMethods = (
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

interface SelectOperator {
  label: string;
  value: WegasOperators;
}

const filterOperators = (
  methodReturns: WegasMethod['returns'],
): SelectOperator[] =>
  Object.keys(booleanOperators)
    .filter(k => methodReturns === 'number' || k === '===')
    .map((k: WegasOperators) => ({
      label: booleanOperators[k].label,
      value: k,
    }));

type EpressionType = 'variable' | 'global';

interface IParameterAttributes {
  [param: number]: unknown;
}

interface IForcedAttributes extends IParameterAttributes {
  initExpression: ScriptItemValue;
  methodName: string;
}

interface IAttributes extends IParameterAttributes {
  initExpression?: ScriptItemValue;
  methodName?: string;
}
const defaultAttributes: IAttributes = {
  initExpression: undefined,
  methodName: undefined,
};

interface IForcedConditionAttributes extends IForcedAttributes {
  operator: WegasOperators;
  comparator: unknown;
}
interface IConditionAttributes extends IAttributes {
  operator?: WegasOperators;
  comparator?: unknown;
}
const defaultConditionAttributes: IConditionAttributes = {
  ...defaultAttributes,
  operator: undefined,
  comparator: undefined,
};

const typeCleaner = (variable: unknown, expectedType: WegasTypeString) => {
  const variableCurrentType = typeof variable;
  if (variableCurrentType === expectedType) {
    return variable;
  } else {
    switch (expectedType) {
      case 'boolean': {
        if (variableCurrentType === 'number') {
          return Boolean(variable);
        } else {
          return undefined;
        }
      }
      case 'number': {
        if (!isNaN(Number(variable))) {
          return Number(variable);
        } else {
          return undefined;
        }
      }
      case 'string': {
        if (
          variableCurrentType === 'number' ||
          variableCurrentType === 'boolean'
        ) {
          return String(variable);
        } else {
          return undefined;
        }
      }
      case 'null': {
        return null;
      }
      default: {
        return undefined;
      }
    }
  }
};

const isConditionAttributes = (
  scriptAttributes: IAttributes | IConditionAttributes,
): scriptAttributes is IConditionAttributes => {
  const scriptKeys = Object.keys(scriptAttributes);
  const compKeys = Object.keys(defaultConditionAttributes);
  return scriptKeys.filter(k => compKeys.includes(k)).length > 0;
};
const hasFilledAttributes = (
  scriptAttributes: IAttributes,
): scriptAttributes is IForcedAttributes =>
  Object.values(scriptAttributes).every(v => v !== undefined);
const hasFilledConditionAttributes = (
  scriptAttributes: IConditionAttributes,
): scriptAttributes is IForcedConditionAttributes =>
  Object.values(scriptAttributes).every(v => v !== undefined);

interface IArgumentSchemaAtributes {
  [param: number]: WegasMethodParameter & {
    type: TYPESTRING;
    oldType: WegasTypeString;
  };
}
interface IInitSchemaAttributes extends IArgumentSchemaAtributes {
  initExpression: ReturnType<typeof schemaProps['tree']>;
}

interface ISchemaAttributes extends IInitSchemaAttributes {
  methodName: ReturnType<typeof schemaProps['select']>;
}
interface IConditionSchemaAttributes extends ISchemaAttributes {
  operator: ReturnType<typeof schemaProps['select']>;
  comparator: ReturnType<typeof schemaProps['custom']>;
}
interface IUnknownSchema {
  description: string;
  properties:
    | IInitSchemaAttributes
    | ISchemaAttributes
    | IConditionSchemaAttributes;
}

const isConditionSchemaAttributes = (
  schemaAttributes: ISchemaAttributes | IConditionSchemaAttributes,
): schemaAttributes is IConditionSchemaAttributes => {
  return isConditionAttributes(
    // Don't worry here, the function is only comparing keys
    (schemaAttributes as unknown) as IAttributes | IConditionAttributes,
  );
};
function genGlobalItems<T = string>(
  mode?: ScriptMode,
  decorateFn?: (value: string) => T,
): Item<StringOrT<typeof decorateFn, T>>[] {
  return Object.entries(SCRIPTS[mode === 'GET' ? 'condition' : 'impact']).map(
    ([k, v]) => ({
      label: v.label,
      value: decorateFn ? decorateFn(k) : k,
    }),
  );
}

interface ScriptItemValue {
  type: EpressionType;
  script: string;
}

const makeItems: (value: string, type: EpressionType) => ScriptItemValue = (
  value,
  type,
) => ({
  type,
  script: type === 'global' ? value : `Variable.find(gameModel,'${value}')`,
});

const makeSchemaInitExpression = (
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
    ],
    false,
    undefined,
    'object',
    'DEFAULT',
    0,
    'inline',
  ),
});

const makeSchemaParameters = (
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

const makeGlobalMethodSchema = (
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

const makeVariableMethodSchema = (
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
    ...(scriptMethod && isScriptCondition(mode, scriptableClassFilter)
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

interface ExpressionEditorState {
  attributes?: IAttributes | IConditionAttributes;
  schema?: ReturnType<typeof makeVariableMethodSchema>;
  statement?: Statement;
}

interface ExpressionEditorProps extends ScriptView {
  statement: Statement;
  id?: string;
  onChange?: (expression: Statement | Statement[]) => void;
}

export function ExpressionEditor({
  statement,
  id,
  mode,
  scriptableClassFilter,
  onChange,
}: ExpressionEditorProps) {
  const [error, setError] = React.useState();
  const [srcMode, setSrcMode] = React.useState(false);
  const [newSrc, setNewSrc] = React.useState();
  const [formState, setFormState] = React.useState<ExpressionEditorState>({});
  const variableIds = useStore(() => GameModel.selectCurrent().itemsIds);

  const parseStatement = React.useCallback(
    (statement: Statement): IAttributes | IConditionAttributes | undefined => {
      if (!isEmptyStatement(statement)) {
        if (isScriptCondition(mode, scriptableClassFilter)) {
          if (isConditionStatement(statement)) {
            return {
              initExpression: {
                type: 'variable',
                script: `Variable.find(gameModel,'${getVariable(
                  statement.expression.left,
                )}')`,
              },
              methodName: getMethodName(statement.expression.left),
              ...getParameters(statement.expression.left),
              operator: getOperator(statement.expression),
              comparator: getComparator(statement.expression),
            };
          } else {
            setError('Cannot be parsed as a condition');
          }
        } else {
          if (isImpactStatement(statement)) {
            return {
              initExpression: {
                type: 'variable',
                script: `Variable.find(gameModel,'${getVariable(
                  statement.expression,
                )}')`,
              },
              methodName: getMethodName(statement.expression),
              ...getParameters(statement.expression),
            };
          } else {
            setError('Cannot be parsed as a variable statement');
          }
        }
      }
    },
    [mode, scriptableClassFilter],
  );

  const generateStatement = React.useCallback(
    (
      attributes: IAttributes | IConditionAttributes,
      properties: IUnknownSchema['properties'],
    ) => {
      try {
        let newStatement;
        if (
          isScriptCondition(mode, scriptableClassFilter) &&
          isConditionAttributes(attributes) &&
          isConditionSchemaAttributes(properties)
        ) {
          const comparatorExpectedType = properties.comparator.type;
          const comparatorCurrentType = typeof attributes.comparator;
          if (hasFilledConditionAttributes(attributes)) {
            newStatement = generateConditionStatement(
              attributes,
              properties,
              comparatorExpectedType
                ? comparatorExpectedType
                : isWegasMethodReturnType(comparatorCurrentType)
                ? comparatorCurrentType
                : 'string',
              true,
            );
          }
        } else {
          if (hasFilledAttributes(attributes)) {
            newStatement = expressionStatement(
              generateImpactExpression(attributes, properties, true),
            );
          }
        }
        return newStatement;
      } catch (e) {
        return undefined;
      }
    },
    [mode, scriptableClassFilter],
  );

  const finalizeComputation = React.useCallback(
    (
      value: IAttributes | IConditionAttributes | Statement,
      attributes: IConditionAttributes,
      schema: IUnknownSchema,
    ) => {
      let statement: Statement | undefined;

      // If the statement has just been updated from outside, save it in the state
      if (isStatement(value)) {
        statement = value;
      }
      // If the statement has just been generated, send via onChange
      else {
        statement = generateStatement(attributes, schema.properties);
        if (statement) {
          setError(undefined);
          onChange && onChange(statement);
          setNewSrc(undefined);
        }
      }
      setFormState({
        attributes,
        schema,
        statement,
      });
    },
    [generateStatement, onChange],
  );

  const computeParameters = React.useCallback(
    (
      newAttributes: IInitSchemaAttributes | IAttributes | IConditionAttributes,
      schemaProperties: IInitSchemaAttributes,
      valueIsStatement: boolean,
    ): IParameterAttributes => {
      // Getting parameters in the actual form
      // let parameters = omit(
      //   newAttributes,
      //   Object.keys(defaultConditionAttributes),
      // );

      const parameters: IParameterAttributes = {};
      Object.keys(schemaProperties).map((k: string) => {
        const nK = Number(k);
        // // Removing unused parameters
        // if (schemaProperties[nK] === undefined) {
        //   parameters = omit(parameters, k);
        // }
        // Do not clean values if they come from an external statement
        if (!isNaN(nK)) {
          if (
            valueIsStatement &&
            typeof newAttributes[nK] !== schemaProperties[nK].type
          ) {
            setError(`Argument ${k} is not of the good type`);
          } else {
            // Trying to translate parameter from previous type to new type (undefined if fails)
            parameters[nK] = typeCleaner(
              newAttributes[nK],
              schemaProperties[nK].type as WegasTypeString,
            );
          }
        }
      });
      return parameters;
    },
    [],
  );

  const computeState = React.useCallback(
    (value: IAttributes | IConditionAttributes | Statement) => {
      let testAttributes: IAttributes | IConditionAttributes | undefined;
      let newAttributes: IAttributes | IConditionAttributes;
      let statement: Statement | undefined;
      const valueIsStatement = isStatement(value);
      if (isStatement(value)) {
        if (isEmptyStatement(value)) {
          testAttributes = isScriptCondition(mode, scriptableClassFilter)
            ? defaultConditionAttributes
            : defaultAttributes;
        } else {
          testAttributes = parseStatement(value);
        }
        if (!testAttributes) {
          setError('Statement cannot be parsed');
          return;
        } else {
          newAttributes = testAttributes;
        }
      } else {
        newAttributes = value;
      }

      const newConditionAttributes = {
        operator: undefined,
        comparator: undefined,
      };

      let attributes: IConditionAttributes = {
        initExpression: newAttributes.initExpression,
        methodName: undefined,
        ...newConditionAttributes,
      };

      let variable: IVariableDescriptor | undefined;

      if (attributes.initExpression) {
        if (attributes.initExpression.type === 'global') {
          // Building shema for these methods and selected method (if selected method is undefined then no shema for argument is built)
          const schema = makeGlobalMethodSchema(
            variableIds,
            getGlobalMethodConfig(
              attributes.initExpression.script,
              isScriptCondition(mode, scriptableClassFilter),
            ),
            mode,
            scriptableClassFilter,
          );

          attributes = {
            ...attributes,
            ...computeParameters(
              attributes,
              schema.properties,
              valueIsStatement,
            ),
          };

          finalizeComputation(value, attributes, schema);
        } else {
          variable = safeClientTSScriptEval<IVariableDescriptor>(
            attributes.initExpression.script,
          );
          if (variable) {
            // Getting methods of the descriptor
            getMethodConfig(variable).then(res => {
              // Getting allowedMethods and checking if current method exists in allowed methods
              const allowedMethods = filterMethods(res, mode);
              if (
                newAttributes.methodName &&
                allowedMethods[newAttributes.methodName]
              ) {
                attributes.methodName = newAttributes.methodName;
              } else if (valueIsStatement) {
                attributes.methodName = newAttributes.methodName;
                setError('Statement contains unknown method name');
              }

              // Building shema for these methods and selected method (if selected method is undefined then no shema for argument is built)
              const schema = makeVariableMethodSchema(
                variableIds,
                allowedMethods,
                newAttributes.methodName
                  ? allowedMethods[newAttributes.methodName]
                  : undefined,
                mode,
                scriptableClassFilter,
              );

              // Getting parameters in the current form
              attributes = {
                ...attributes,
                ...computeParameters(
                  newAttributes,
                  schema.properties,
                  valueIsStatement,
                ),
              };

              // Removing operator to atribute if doesn't exists in shema
              if (!('operator' in schema.properties)) {
                if (valueIsStatement && 'operator' in newAttributes) {
                  setError('An impact should not contain an operator');
                  attributes.operator = (newAttributes as IConditionAttributes).operator;
                } else {
                  attributes = omit(attributes, 'operator');
                }
              } else {
                //Removing operator if not allowed
                if (
                  !schema.properties.operator.enum.includes(
                    (newAttributes as IConditionAttributes).operator,
                  )
                ) {
                  if (valueIsStatement) {
                    setError('Operator unknown');
                    attributes.operator = (newAttributes as IConditionAttributes).operator;
                  } else {
                    attributes.operator = undefined;
                  }
                } else {
                  attributes.operator = (newAttributes as IConditionAttributes).operator;
                }
              }

              // Removing copmparator to atribute if doesn't exists in shema
              if (!('comparator' in schema.properties)) {
                attributes = omit(attributes, 'comparator');
              }
              //Do not clean values if they come from an external statement
              else if (
                valueIsStatement &&
                typeof (newAttributes as IConditionAttributes).comparator !==
                  schema.properties.comparator.type
              ) {
                setError('Comparator type mismatch');
              } else {
                //Trying to translate operator
                attributes.comparator = typeCleaner(
                  (newAttributes as IConditionAttributes).comparator,
                  schema.properties.comparator.type as WegasTypeString,
                );
              }

              finalizeComputation(value, attributes, schema);
            });
          }
        }
      }
      if (
        !attributes.initExpression ||
        (attributes.initExpression.type === 'variable' && !variable)
      )
        setFormState({
          attributes,
          schema: makeGlobalMethodSchema(variableIds),
          statement,
        });
    },
    [
      mode,
      scriptableClassFilter,
      parseStatement,
      variableIds,
      computeParameters,
      finalizeComputation,
    ],
  );

  const onScripEditorSave = React.useCallback(
    (value: string) => {
      setNewSrc(undefined);
      try {
        const newStatement = parse(value, {
          sourceType: 'script',
        }).program.body;
        setError(undefined);
        if (newStatement.length === 1) {
          // computeState(newStatement[0]);
          onChange && onChange(newStatement[0]);
        }
        //onChange && onChange(newStatement);
      } catch (e) {
        setError(e.message);
      }
    },
    [onChange],
  );

  React.useEffect(
    () => {
      if (
        !formState.statement ||
        generate(formState.statement) !== generate(statement)
      ) {
        computeState(statement);
      }
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    /* Linter disabled for the following lines to avoid reloading when state change */
    [
      /*formState,*/
      statement,
      computeState,
    ],
  );
  /* eslint-enable */

  return (
    <div id={id} className={expressionEditorStyle}>
      {newSrc === undefined && error === undefined && (
        <IconButton
          icon="code"
          pressed={error !== undefined}
          onClick={() => setSrcMode(sm => !sm)}
        />
      )}
      {error || srcMode ? (
        <div className={scriptEditStyle}>
          <MessageString type="error" value={error} duration={10000} />
          {newSrc !== undefined && (
            <IconButton icon="save" onClick={() => onScripEditorSave(newSrc)} />
          )}
          <WegasScriptEditor
            value={
              newSrc === undefined
                ? formState.statement && !isEmptyStatement(formState.statement)
                  ? generate(formState.statement).code
                  : ''
                : newSrc
            }
            onChange={setNewSrc}
            noGutter
            minimap={false}
            returnType={returnTypes(mode, scriptableClassFilter)}
            onSave={onScripEditorSave}
          />
        </div>
      ) : (
        <Form
          value={formState.attributes}
          schema={formState.schema}
          onChange={(v, e) => {
            if (e && e.length > 0) {
              setFormState(fs => {
                const errorStatement = fs.schema
                  ? generateStatement(v, fs.schema.properties)
                  : undefined;

                return {
                  ...fs,
                  attributes: v,
                  statement: errorStatement,
                };
              });
            } else {
              computeState(v);
            }
          }}
          context={
            formState.attributes
              ? {
                  initExpression: formState.attributes.initExpression,
                }
              : {}
          }
        />
      )}
    </div>
  );
}

interface StatementViewProps extends WidgetProps.BaseProps {
  value: Statement;
  view: CommonView & LabeledView & ScriptView;
}

export default function StatementView(props: StatementViewProps) {
  return (
    <CommonViewContainer errorMessage={props.errorMessage} view={props.view}>
      <Labeled {...props.view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <ExpressionEditor
              id={inputId}
              onChange={props.onChange}
              statement={props.value}
              {...props.view}
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
