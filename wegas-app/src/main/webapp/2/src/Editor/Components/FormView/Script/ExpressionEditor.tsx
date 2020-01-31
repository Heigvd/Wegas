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
  emptyStatement,
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
import { wlog } from '../../../../Helper/wegaslog';
import { TYPESTRING, WidgetProps } from 'jsoninput/typings/types';
import { themeVar } from '../../../../Components/Theme';
import { VariableDescriptor } from '../../../../data/selectors';
import { isStatement } from '@babel/types';
import { CommonView, CommonViewContainer } from '../commonView';
import { LabeledView, Labeled } from '../labeled';

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

const makeShema = (
  methods: MethodConfig,
  scriptMethod?: WegasMethod,
  mode?: ScriptMode,
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
): {
  description: string;
  properties: ISchemaAttributes | IConditionSchemaAttributes;
} => {
  return {
    description: 'scriptExpressionSchema',
    properties: {
      variableName: schemaProps.variable(
        undefined,
        false,
        undefined,
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
  };
};

interface ExpressionEditorState {
  attributes?: IAttributes | IConditionAttributes;
  schema?: ReturnType<typeof makeShema>;
  statement?: Statement;
}

interface ExpressionEditorProps extends ScriptView {
  statement: Statement;
  id?: string;
  onChange?: (expression: Statement | Statement[]) => void;
  onDelete?: () => void;
}

export function ExpressionEditor({
  statement,
  id,
  mode,
  scriptableClassFilter,
  onChange,
  onDelete,
}: ExpressionEditorProps) {
  //const [currentStatement, setCurrentStatement] = React.useState(statement);
  const [error, setError] = React.useState();
  const [srcMode, setSrcMode] = React.useState(false);
  const [newSrc, setNewSrc] = React.useState();
  const [formState, setFormState] = React.useState<ExpressionEditorState>({});

  const parseStatement = React.useCallback(
    (statement: Statement) => {
      if (!isEmptyStatement(statement)) {
        if (isScriptCondition(mode, scriptableClassFilter)) {
          if (isConditionStatement(statement)) {
            return {
              variableName: getVariable(statement.expression.left),
              methodName: getMethodName(statement.expression.left),
              ...getParameters(statement.expression.left),
              operator: getOperator(statement.expression),
              comparator: getComparator(statement.expression),
            };
          } else {
            setError('Cannot be parsed as a condition');
          }
        } else {
          if (isVariableMethodStatement(statement)) {
            return {
              variableName: getVariable(statement.expression),
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
      properties: ISchemaAttributes | IConditionSchemaAttributes,
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

  const computeState = React.useCallback(
    (
      value: IAttributes | IConditionAttributes | Statement,
      formErrored?: boolean,
    ) => {
      let testAttributes: IAttributes | IConditionAttributes | undefined;
      let newAttributes: IAttributes | IConditionAttributes;
      let statement: Statement | undefined;
      const valueIsStatement = isStatement(value);
      if (isStatement(value)) {
        testAttributes = parseStatement(value);
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
        variableName: newAttributes.variableName,
        methodName: undefined,
        ...newConditionAttributes,
      };

      // Getting variable descriptor and checking if exists
      const variable = VariableDescriptor.findByName(
        newAttributes.variableName,
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
          const schema = makeShema(
            allowedMethods,
            newAttributes.methodName
              ? allowedMethods[newAttributes.methodName]
              : undefined,
            mode,
            scriptableClassFilter,
          );

          // Getting parameters in the actual form
          const parameters = omit(newAttributes, Object.keys(attributes));
          Object.keys(parameters).map((k: string) => {
            const nK = Number(k);
            // Removing unused parameters
            if (schema.properties[nK] === undefined) {
              attributes = omit(attributes, k);
            }
            //Do not clean values if they come from an external statement
            else if (
              valueIsStatement &&
              typeof newAttributes[nK] !== schema.properties[nK].type
            ) {
              setError(`Argument ${k} is not of the good type`);
            } else {
              // Trying to translate parameter from previous type to new type (undefined if fails)
              attributes[nK] = typeCleaner(
                newAttributes[nK],
                schema.properties[nK].type as WegasTypeString,
              );
            }
          });

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
        });
      }
    },
    [mode, scriptableClassFilter, parseStatement, generateStatement, onChange],
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
    [computeState],
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
            //onBlur={() => newSrc !== undefined && onScripEditorSave(newSrc)}
            onSave={onScripEditorSave}
          />
        </div>
      ) : (
        <Form
          value={formState.attributes}
          schema={formState.schema}
          onChange={(v, e) => {
            if (e && e.length > 0) {
              // const newValues = e.reduce((o, err) => {
              //   const property = err.property.match(
              //     /(^instance\[([0-9]*)\]$)|(^instance\.(([a-z]|[0-9])*)$)/,
              //   );
              //   if (property != null) {
              //     const numberKey = property[2];
              //     const stringKey = property[4];
              //     if (numberKey != null) {
              //       return {
              //         ...o,
              //         [numberKey]: typeCleaner(v[numberKey], err.argument[0]),
              //       };
              //     } else if (stringKey != null) {
              //       return {
              //         ...o,
              //         [stringKey]: typeCleaner(v[stringKey], err.argument[0]),
              //       };
              //     }
              //   }
              //   return o;
              // }, {});
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
            // console.log(e);
            // computeState(v);
          }}
          context={
            formState.attributes
              ? {
                  variableName: formState.attributes.variableName,
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
