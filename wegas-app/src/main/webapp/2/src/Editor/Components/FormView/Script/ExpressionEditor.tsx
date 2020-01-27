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
  scriptIsCondition,
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
} from '../../../editionConfig';
import { useVariableDescriptor } from '../../../../Components/Hooks/useVariable';
import { schemaProps } from '../../../../Components/PageComponents/tools/schemaProps';
import Form from 'jsoninput';
import { css } from 'emotion';
import { WegasScriptEditor } from '../../ScriptEditors/WegasScriptEditor';
import { parse } from '@babel/parser';
import { pick, omit } from 'lodash';
import { IconButton } from '../../../../Components/Inputs/Button/IconButton';
import { deepDifferent } from '../../../../Components/Hooks/storeHookFactory';
import { MessageString } from '../../MessageString';
import { wlog } from '../../../../Helper/wegaslog';
import { TYPESTRING, WidgetProps } from 'jsoninput/typings/types';
import { VariableDescriptor } from '../../../../data/selectors';
import { CommonView, CommonViewContainer } from '../commonView';
import { LabeledView, Labeled } from '../labeled';

const expressionEditorStyle = css({
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

const isVariableMethodStatement = (
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
  isVariableMethodStatement({
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

const generateImpactExpression = (
  scriptAttributes: IForcedAttributes,
  schemaAttributes: IArgumentSchemaAtributes,
  tolerateTypeVariation?: boolean,
) => {
  return callExpression(
    memberExpression(
      callExpression(
        memberExpression(identifier('Variable'), identifier('find')),
        [identifier('gameModel'), stringLiteral(scriptAttributes.variableName)],
      ),
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
  methodReturn: WegasMethod['returns'],
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

interface IForcedAttributes {
  [param: number]: unknown;
  variableName: string;
  methodName: string;
}

interface IAttributes {
  [param: number]: unknown;
  variableName?: string;
  methodName?: string;
}
const defaultAttributes: IAttributes = {
  variableName: undefined,
  methodName: undefined,
};

class ValidationError extends Error {
  key: keyof IForcedConditionAttributes;
  expected: unknown;
  constructor(
    key: keyof IForcedConditionAttributes,
    expected: unknown,
    message: string,
  ) {
    super(message);
    this.key = key;
    this.expected = expected;
  }
}

const validateAttributes = (
  callback: (
    validatedResult: IForcedAttributes | ValidationError,
    methodReturnType?: WegasMethod['returns'],
    allowedMethods?: MethodConfig,
  ) => void,
  attributes: IForcedAttributes,
  mode?: ScriptMode,
) => {
  const entity = VariableDescriptor.findByName(attributes.variableName);
  if (entity) {
    getMethodConfig(entity).then(res => {
      const allowedMethods = filterMethods(res, mode);
      const currentMethod = allowedMethods[attributes.methodName];
      if (currentMethod) {
        for (let i = 0; i < currentMethod.parameters.length; ++i) {
          const expectedType = currentMethod.parameters[i].type;
          const actualType = typeof attributes[i];
          if (
            typeof actualType === 'string' &&
            expectedType === 'number' &&
            !isNaN(Number(attributes[i]))
          ) {
            attributes[i] = Number(attributes[i]);
          } else if (
            typeof actualType === 'number' &&
            expectedType === 'string'
          ) {
            attributes[i] = String(attributes[i]);
          } else if (
            expectedType !== actualType &&
            !(expectedType === 'identifier' && actualType === 'string')
          ) {
            callback(
              new ValidationError(
                i,
                expectedType,
                `The parameter ${i} is not the good type. Expected ${expectedType} got ${actualType}`,
              ),
            );
          }
        }
        callback(attributes, currentMethod.returns);
      } else {
        callback(
          new ValidationError(
            'methodName',
            allowedMethods,
            `The method ${attributes.methodName} is not a method of ${entity['@class']} entity`,
          ),
        );
      }
    });
  } else {
    callback(
      new ValidationError(
        'variableName',
        'WegasEntity',
        `The variable ${attributes.variableName} is unknown`,
      ),
    );
  }
};

const validateExpression = (
  callback: (
    validatedResult: IForcedAttributes | ValidationError,
    methodReturnType?: WegasMethod['returns'],
  ) => void,
  expression: ImpactExpression,
  mode?: ScriptMode,
) => {
  const variableName = getVariable(expression);
  const methodName = getMethodName(expression);
  const parameters = getParameters(expression);
  validateAttributes(
    callback,
    { variableName, methodName, ...parameters },
    mode,
  );
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

const isOperatorAllowed = (
  operator: BinaryExpression['operator'],
  methodReturnType: WegasMethod['returns'],
): operator is WegasOperators =>
  filterOperators(methodReturnType).find(o => o.value === operator) !==
  undefined;

const validateConditionAttributes = (
  callback: (
    validatedResult: IForcedConditionAttributes | ValidationError,
  ) => void,
  attributes: IForcedConditionAttributes,
  mode?: ScriptMode,
) => {
  validateAttributes(
    (validatedScriptAttributes, methodReturnType) => {
      if (validatedScriptAttributes instanceof ValidationError) {
        callback(validatedScriptAttributes);
      } else {
        if (isOperatorAllowed(attributes.operator, methodReturnType!)) {
          callback(attributes);
          if (
            typeof attributes.comparator === methodReturnType ||
            (typeof attributes.comparator === 'string' &&
              methodReturnType === 'number' &&
              !isNaN(Number(attributes.comparator)))
          ) {
            callback({
              ...attributes,
              comparator: Number(attributes.comparator),
            });
          } else if (
            typeof attributes.comparator === 'number' &&
            methodReturnType === 'string'
          ) {
            callback({
              ...attributes,
              comparator: String(attributes.comparator),
            });
          } else {
            callback(
              new ValidationError(
                'comparator',
                methodReturnType,
                `Comparator type not allowed. Expected ${methodReturnType}, got ${typeof attributes.comparator}`,
              ),
            );
          }
        } else {
          callback(
            new ValidationError(
              'operator',
              filterOperators(methodReturnType!),
              `Operator ${attributes.operator} not allowed with current method`,
            ),
          );
        }
      }
    },
    attributes,
    mode,
  );
};

const validateConditionnalExpression = (
  callback: (
    validatedResult: IForcedConditionAttributes | ValidationError,
    methodReturnType?: WegasMethod['returns'],
  ) => void,
  expression: ConditionExpression,
  mode?: ScriptMode,
) => {
  const variableName = getVariable(expression.left);
  const methodName = getMethodName(expression.left);
  const parameters = getParameters(expression.left);
  const operator = getOperator(expression);
  const comparator = getComparator(expression);
  validateConditionAttributes(
    callback,
    { variableName, methodName, operator, comparator, ...parameters },
    mode,
  );
};

interface ConfigModes {
  impact: IForcedAttributes;
  condition: IConditionAttributes;
}

function autoValidateAttributes<T extends keyof ConfigModes>(
  mode: T,
  callback: (validatedResult: ConfigModes[T] | ValidationError) => void,
  attributes: ConfigModes[T],
) {
  if (mode === 'condition') {
    validateConditionAttributes(
      callback,
      attributes as IForcedConditionAttributes,
      'GET',
    );
  } else {
    validateAttributes(callback, attributes as IForcedAttributes, 'SET');
  }
}

const typeCleaner = (
  variable: unknown,
  expectedType: WegasTypeString,
  lastValue?: unknown,
) => {
  switch (expectedType) {
    case 'boolean': {
      return Boolean(variable);
    }
    case 'number': {
      if (!isNaN(Number(variable))) {
        return Number(variable);
      } else {
        if (lastValue !== undefined) {
          return lastValue;
        } else {
          return undefined;
        }
      }
    }
    case 'string': {
      return JSON.stringify(variable);
    }
    case 'array': {
      return [variable];
    }
    case 'object': {
      return { variable: variable };
    }
    case 'identifier': {
      return JSON.stringify(variable);
    }
    case 'null': {
      return null;
    }
    default: {
      return null;
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
interface ISchemaAttributes extends IArgumentSchemaAtributes {
  variableName: ReturnType<typeof schemaProps['variable']>;
  methodName: ReturnType<typeof schemaProps['select']>;
}
interface IConditionSchemaAttributes extends ISchemaAttributes {
  operator: ReturnType<typeof schemaProps['select']>;
  comparator: ReturnType<typeof schemaProps['custom']>;
}
const isConditionSchemaAttributes = (
  schemaAttributes: ISchemaAttributes | IConditionSchemaAttributes,
): schemaAttributes is IConditionSchemaAttributes => {
  return isConditionAttributes(
    // Don't worry here, the function is only comparing keys
    (schemaAttributes as unknown) as IAttributes | IConditionAttributes,
  );
};

interface ExpressionEditorProps extends ScriptView {
  statement: Statement;
  onChange?: (expression: Statement | Statement[]) => void;
  onDelete?: () => void;
  id?: string;
}

export function ExpressionEditor({
  statement,
  mode,
  scriptableClassFilter,
  onChange,
  onDelete,
  id,
}: ExpressionEditorProps) {
  const [currentStatement, setCurrentStatement] = React.useState<Statement>(
    statement,
  );
  const [error, setError] = React.useState();
  const [srcMode, setSrcMode] = React.useState(false);
  const [newSrc, setNewSrc] = React.useState();
  const [scriptAttributes, setScriptAttributes] = React.useState<
    IAttributes | IConditionAttributes /* & { [param: string]: unknown }*/
  >(
    scriptIsCondition(mode, scriptableClassFilter)
      ? defaultConditionAttributes
      : defaultAttributes,
  );
  const variable = useVariableDescriptor(scriptAttributes.variableName);
  const scriptMethodName = scriptAttributes.methodName;
  const [methods, setMethods] = React.useState<{
    [key: string]: WegasMethod;
  }>({});
  const mounted = React.useRef<boolean>(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });

  const scriptMethod =
    scriptAttributes && scriptMethodName !== undefined
      ? methods[scriptMethodName]
      : undefined;

  const schema: {
    description: string;
    properties: ISchemaAttributes | IConditionSchemaAttributes;
  } = {
    description: 'booleanExpressionSchema',
    properties: {
      variableName: schemaProps.variable(
        undefined,
        false,
        scriptIsCondition(mode, scriptableClassFilter)
          ? undefined
          : scriptableClassFilter &&
              scriptableClassFilter.map(sf => sf.substr(2) as WegasClassNames),
        false,
        'DEFAULT',
        0,
        'inline',
      ),
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
      ...(scriptMethod
        ? scriptMethod.parameters.reduce(
            (o, p, i) => ({
              ...o,
              [i]: {
                ...p,
                index: 2 + i,
                type: p.type === 'identifier' ? 'string' : p.type,
                oldType: p.type,
                view: {
                  ...p.view,
                  index: 2 + i,
                  layout: 'inline',
                },
              },
            }),
            {},
          )
        : {}),
      ...(scriptMethod && scriptIsCondition(mode, scriptableClassFilter)
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
  };
  const onStatementChange = React.useCallback(
    (attributes: IAttributes | IConditionAttributes) => {
      if (mounted.current) {
        try {
          if (scriptMethod) {
            let newStatement;
            if (
              scriptIsCondition(mode, scriptableClassFilter) &&
              isConditionAttributes(attributes) &&
              isConditionSchemaAttributes(schema.properties)
            ) {
              if (hasFilledConditionAttributes(attributes)) {
                newStatement = generateConditionStatement(
                  attributes,
                  schema.properties,
                  scriptMethod.returns,
                );
              }
            } else {
              if (hasFilledAttributes(attributes)) {
                newStatement = expressionStatement(
                  generateImpactExpression(attributes, schema.properties),
                );
              }
            }

            if (newStatement !== undefined) {
              setError(undefined);
              setCurrentStatement(newStatement);
              onChange && onChange(newStatement);
              setNewSrc(undefined);
            }
          }
        } catch (e) {
          // setError(e.message);
          setScriptAttributes(attributes);
        }
        setScriptAttributes(attributes);
      }
    },
    [onChange, schema.properties, mode, scriptMethod, scriptableClassFilter],
  );

  const onScripEditorSave = React.useCallback(
    (value: string) => {
      try {
        const newStatement = parse(value, {
          sourceType: 'script',
        }).program.body;
        setError(undefined);
        if (newStatement.length === 1) {
          setCurrentStatement(newStatement[0]);
        }
        onChange && onChange(newStatement);
        if (mounted.current) {
          setNewSrc(undefined);
        }
      } catch (e) {
        if (mounted.current) {
          setError(e.message);
        }
      }
    },
    [onChange],
  );

  React.useEffect(() => {
    setCurrentStatement(cs => {
      if (deepDifferent(cs, statement)) {
        return statement;
      } else {
        return cs;
      }
    });
  }, [statement]);

  React.useEffect(() => {
    if (variable) {
      getMethodConfig(variable).then(res => {
        setMethods(filterMethods(res, mode));
      });
    } else {
      setMethods({});
    }
  }, [variable, mode]);

  React.useEffect(() => {
    if (!isEmptyStatement(currentStatement)) {
      if (scriptIsCondition(mode, scriptableClassFilter)) {
        if (isConditionStatement(currentStatement)) {
          validateConditionnalExpression(
            validatedScriptAttributes => {
              if (mounted.current) {
                if (validatedScriptAttributes instanceof ValidationError) {
                  setError(validatedScriptAttributes.message);
                } else {
                  setScriptAttributes(validatedScriptAttributes);
                }
              }
            },
            currentStatement.expression,
            mode,
          );
        } else {
          setError('Cannot be parsed as a condition');
        }
      } else {
        if (isVariableMethodStatement(currentStatement)) {
          validateExpression(
            validatedScriptAttributes => {
              if (mounted.current) {
                if (validatedScriptAttributes instanceof ValidationError) {
                  setError(validatedScriptAttributes.message);
                } else {
                  setScriptAttributes(
                    omit(validatedScriptAttributes, 'methodReturnType'),
                  );
                }
              }
            },
            currentStatement.expression,
            mode,
          );
        } else {
          setError('Cannot be parsed as a variable statement');
        }
      }
    }
  }, [currentStatement, mode, scriptableClassFilter]);

  return (
    <div
      id={id}
      className={expressionEditorStyle}
      //onBlur={()=>onEditorChange(scriptAttributes)}
      onBlur={() => wlog('BLUR')}
    >
      {newSrc === undefined && (
        <IconButton
          icon="code"
          pressed={error !== undefined}
          onClick={() => setSrcMode(sm => !sm)}
        />
      )}
      <IconButton icon="trash" onClick={onDelete} />
      {error || srcMode ? (
        <div className={scriptEditStyle}>
          <MessageString type="error" value={error} duration={10000} />
          <WegasScriptEditor
            value={
              newSrc === undefined
                ? !isEmptyStatement(currentStatement)
                  ? generate(currentStatement).code
                  : ''
                : newSrc
            }
            onChange={setNewSrc}
            noGutter
            minimap={false}
            returnType={returnTypes(mode, scriptableClassFilter)}
            onBlur={onScripEditorSave}
            onSave={onScripEditorSave}
          />
        </div>
      ) : (
        <Form
          value={pick(scriptAttributes, Object.keys(schema.properties))}
          schema={schema}
          onChange={(v, e) => {
            if (e && e.length > 0) {
              // const newValues = e.reduce(
              //   (o, err) => ({
              //     ...o,
              //     [err.property.replace('instance.', '')]: undefined,
              //   }),
              //   {},
              // );
              setScriptAttributes(v);
            } else {
              const newScriptAttributes: IForcedConditionAttributes = {
                variableName: '',
                methodName: '',
                operator: '===',
                comparator: '',
                ...v,
              };
              let validated;
              do {
                validated = true;
                autoValidateAttributes(
                  scriptIsCondition(mode, scriptableClassFilter)
                    ? 'condition'
                    : 'impact',
                  validatedResult => {
                    if (validatedResult instanceof ValidationError) {
                      switch (validatedResult.key) {
                        case 'variableName': {
                          setError(validatedResult.message);
                          break;
                        }
                        case 'methodName': {
                          const allowedMethods = Object.keys(
                            validatedResult.expected as MethodConfig,
                          );
                          if (allowedMethods.length === 0) {
                            setError(validatedResult.message);
                          } else {
                            newScriptAttributes.methodName = Object.keys(
                              allowedMethods,
                            )[0];
                            validated = false;
                          }
                          break;
                        }
                        case 'operator': {
                          const allowedOperators = validatedResult.expected as SelectOperator[];
                          if (allowedOperators.length === 0) {
                            setError(validatedResult.message);
                          } else {
                            newScriptAttributes.operator =
                              allowedOperators[0].value;
                            validated = false;
                          }
                          break;
                        }
                        case 'comparator': {
                          const returnType = validatedResult.expected as
                            | WegasMethod['returns']
                            | undefined;
                          const currentValue = newScriptAttributes.comparator;
                          if (returnType === undefined) {
                            if (currentValue === undefined) {
                              setError(validatedResult.message);
                            } else {
                              newScriptAttributes.comparator = undefined;
                              validated = false;
                            }
                          } else {
                            newScriptAttributes.comparator = typeCleaner(
                              currentValue,
                              returnType,
                              'comparator' in scriptAttributes &&
                                scriptAttributes.comparator,
                            );
                          }
                          break;
                        }
                        /**
                         * This case is for arguments
                         */
                        default: {
                          const expectedType = validatedResult.expected as WegasTypeString;
                          const currentValue =
                            newScriptAttributes[validatedResult.key];
                          if (Array.isArray(expectedType)) {
                            const nonNullTypes = expectedType.filter(
                              t => t != 'null',
                            );
                            if (nonNullTypes.length > 0) {
                              newScriptAttributes[
                                validatedResult.key
                              ] = typeCleaner(
                                currentValue,
                                nonNullTypes[0],
                                scriptAttributes[0],
                              );
                            } else {
                              newScriptAttributes[validatedResult.key] = null;
                            }
                          } else {
                            newScriptAttributes[
                              validatedResult.key
                            ] = typeCleaner(
                              currentValue,
                              expectedType,
                              scriptAttributes[0],
                            );
                          }
                        }
                      }
                    }
                  },
                  newScriptAttributes,
                );
              } while (!validated);
              onStatementChange(newScriptAttributes);
              //onStatementChange(v);
            }
          }}
          context={{
            variableName: scriptAttributes.variableName,
          }}
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
