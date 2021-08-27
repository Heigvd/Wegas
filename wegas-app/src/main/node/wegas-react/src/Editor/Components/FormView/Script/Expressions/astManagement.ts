import {
  isArrayExpression,
  arrayExpression,
  ArrayExpression,
  isBooleanLiteral,
  booleanLiteral,
  BooleanLiteral,
  isIdentifier,
  identifier,
  Identifier,
  isNullLiteral,
  nullLiteral,
  isNumericLiteral,
  numericLiteral,
  NumericLiteral,
  isStringLiteral,
  stringLiteral,
  StringLiteral,
  isObjectExpression,
  objectExpression,
  ObjectExpression,
  isObjectProperty,
  objectProperty,
  ObjectProperty,
  Statement,
  isExpressionStatement,
  isCallExpression,
  isMemberExpression,
  Node,
  expressionStatement,
  CallExpression,
  Expression,
  BinaryExpression,
  Literal,
  isBinaryExpression,
  NullLiteral,
  callExpression,
  memberExpression,
  binaryExpression,
  emptyStatement,
  ExpressionStatement,
  MemberExpression,
  isPrivateName,
  PrivateName,
} from '@babel/types';
import { omit } from 'lodash-es';
import {
  WegasOperators,
  defaultConditionAttributes,
  IAttributes,
  IConditionAttributes,
  IInitAttributes,
  defaultInitAttributes,
  WyiswygExpressionSchema,
  isConditionAttributes,
  isConditionSchemaAttributes,
  isAttributes,
  PartialAttributes,
  PartialSchemaAttributes,
  isBooleanExpression,
} from './expressionEditorHelpers';
import { isWegasMethodReturnType } from '../../../../editionConfig';
import { isScriptCondition } from '../Script';
import { isEmptyStatement } from '@babel/types';
import { parse } from '@babel/parser';
import { wlog } from '../../../../../Helper/wegaslog';

/////////////////////////////////////////////
// METHODS //////////////////////////////////
/////////////////////////////////////////////

export const allowedArgumentTypes = {
  array: {
    checker: isArrayExpression,
    generator: arrayExpression,
    parser: (
      expression: ArrayExpression,
      parser: (node: Node | null) => unknown,
    ) => expression.elements.map(e => parser(e)),
  },
  boolean: {
    checker: isBooleanLiteral,
    generator: booleanLiteral,
    parser: (expression: BooleanLiteral) => expression.value,
  },
  identifier: {
    checker: isIdentifier,
    generator: identifier,
    parser: (expression: Identifier) =>
      expression.name === 'undefined' ? undefined : expression.name,
  },
  null: {
    checker: isNullLiteral,
    generator: nullLiteral,
    parser: () => null,
  },
  number: {
    checker: isNumericLiteral,
    generator: numericLiteral,
    parser: (expression: NumericLiteral) => expression.value,
  },
  string: {
    checker: isStringLiteral,
    generator: stringLiteral,
    parser: (expression: StringLiteral) => expression.value,
  },
  object: {
    checker: isObjectExpression,
    generator: objectExpression,
    parser: (
      expression: ObjectExpression,
      parser: (node: Node | null) => { [key: string]: unknown },
    ) =>
      Object.values(expression.properties).reduce(
        (o, v) => ({ ...o, ...parser(v) }),
        {},
      ),
  },
  objectProperty: {
    checker: isObjectProperty,
    generator: objectProperty,
    parser: (
      expression: ObjectProperty,
      parser: (node: Node | null) => unknown,
    ) => ({
      [String(parser(expression.key))]: parser(expression.value),
    }),
  },
};

function methodParameterParse(node: Node | null) {
  for (const typeMethods of Object.values(allowedArgumentTypes)) {
    if (typeMethods.checker(node)) {
      // @ts-ignore we can ignore the ts error here as we ensured the node's type with the checker
      return typeMethods.parser(node, methodParameterParse);
    }
  }
  throw Error(`Argument's node ${node?.type} cannot be parsed`);
}

const generateMethodStatement = (
  scriptAttributes: PartialAttributes,
  schemaAttributes: WyiswygExpressionSchema['properties'],
  tolerateTypeVariation?: boolean,
) => {
  if (scriptAttributes.initExpression) {
    const initStatement = parse(scriptAttributes.initExpression.script, {
      sourceType: 'script',
    }).program.body[0];
    if (isExpressionStatement(initStatement)) {
      const expression = initStatement.expression;
      if (isMemberExpression(expression) || isIdentifier(initStatement)) {
        return expressionStatement(
          generateCallExpression(
            expression,
            scriptAttributes,
            schemaAttributes,
            tolerateTypeVariation,
          ),
        );
      }
    }
  }
  return emptyStatement();
};

/////////////////////////////////////////////
// VARIABLES METHODS ////////////////////////
/////////////////////////////////////////////

type ImpactExpression = CallExpression & {
  callee: MemberExpression & {
    object: Identifier;
    property: {
      name: string;
    };
  };
  arguments: Expression[];
};

type ImpactStatement = Statement & {
  expression: ImpactExpression;
};

type ConditionExpression = BinaryExpression & {
  left: CallExpression & ImpactExpression;
  right: {
    value: unknown;
  };
  operator: WegasOperators;
};

type ConditionStatement = ExpressionStatement & {
  expression: ConditionExpression;
};

type ConditionCallStatement = ExpressionStatement & {
  expression: ImpactExpression;
};

type GlobalMethodIdentifierObject = {
  name: string;
};

type GlobalMethodObject = {
  object: GlobalMethodObject;
};

type GlobalMethodCallee = MemberExpression & {
  object: GlobalMethodIdentifierObject | GlobalMethodObject;
};

type GlobalMethodCallStatement = ExpressionStatement & {
  expression: CallExpression & {
    callee: GlobalMethodCallee;
  };
};

function isLiteralExpression(expression: Expression): expression is Literal {
  return (
    (isIdentifier(expression) && expression.name === 'undefined') ||
    expression.type === 'BooleanLiteral' ||
    expression.type === 'NullLiteral' ||
    expression.type === 'NumericLiteral' ||
    expression.type === 'StringLiteral'
  );
}

function isVariableObject(expression: Expression) {
  return isIdentifier(expression) && expression.name === 'Variable';
}
function isFindProperty(expression: Expression | PrivateName) {
  return isIdentifier(expression) && expression.name === 'find';
}

function isImpactStatement(
  statement: Expression | Statement,
): statement is ImpactStatement {
  return (
    isExpressionStatement(statement) &&
    isCallExpression(statement.expression) &&
    isMemberExpression(statement.expression.callee) &&
    isCallExpression(statement.expression.callee.object) &&
    isMemberExpression(statement.expression.callee.object.callee) &&
    isVariableObject(statement.expression.callee.object.callee.object) &&
    isFindProperty(statement.expression.callee.object.callee.property)
  );
}

function getVariable(expression: ImpactExpression) {
  wlog(expression);
  return "DUMMYFUCKINGSTUFF";
  //return expression.callee.object.arguments[1].value;
}
function getMethodName(expression: ImpactExpression) {
  return expression.callee.property.name;
}

function listToObject<T>(list: T[]): { [id: string]: T } {
  return list.reduce((o, p, i) => ({ ...o, [i]: p }), {});
}

function getParameters(expression: CallExpression) {
  return listToObject(expression.arguments.map(methodParameterParse));
}
function isConditionStatement(
  statement: Statement,
): statement is ConditionStatement {
  return (
    isExpressionStatement(statement) &&
    isBinaryExpression(statement.expression) &&
    !isPrivateName(statement.expression.left) &&
    isImpactStatement({
      ...statement,
      type: 'ExpressionStatement',
      expression: statement.expression.left,
    }) &&
    isLiteralExpression(statement.expression.right)
  );
}
function isConditionCallStatement(
  statement: Statement,
): statement is ConditionCallStatement {
  return (
    isExpressionStatement(statement) && isCallExpression(statement.expression)
  );
}

function getGlobalMethodCallObject(object: Expression): string | undefined {
  if (isIdentifier(object) && typeof object.name === 'string') {
    return object.name;
  } else if (isMemberExpression(object)) {
    return getGlobalMethodCallObject(object.object);
  } else {
    return undefined;
  }
}

function isGlobalMethodCallStatement(
  statement: Statement,
): statement is GlobalMethodCallStatement {
  if (
    isExpressionStatement(statement) &&
    isCallExpression(statement.expression) &&
    isMemberExpression(statement.expression.callee)
  ) {
    const objectName = getGlobalMethodCallObject(
      statement.expression.callee.object,
    );
    if (objectName != null && objectName !== 'Variable') {
      return true;
    }
  }
  return false;
}

function getGlobalMethodScript(
  object: GlobalMethodCallee | Expression,
): string | undefined {
  if (isIdentifier(object) && typeof object.name === 'string') {
    return object.name;
  } else if (isMemberExpression(object) && isIdentifier(object.property)) {
    object.object;
    return getGlobalMethodScript(object.object) + '.' + object.property.name;
  } else {
    return undefined;
  }
}

function getOperator(expression: ConditionExpression) {
  return expression.operator;
}

function getComparator(expression: ConditionExpression) {
  return expression.right.value;
}

function variableToASTNode(
  variable: unknown,
  type?: WegasTypeString | WegasTypeString[],
  tolerateTypeVariation?: boolean,
):
  | BooleanLiteral
  | Identifier
  | NullLiteral
  | NumericLiteral
  | ArrayExpression
  | ObjectExpression
  | StringLiteral {
  let usedType;
  const variableType = Array.isArray(variable) ? 'array' : typeof variable;
  if (type === undefined) {
    usedType = variableType;
  } else if (Array.isArray(type)) {
    if (type.includes(variableType as WegasTypeString)) {
      usedType = variableType as WegasTypeString;
    } else if (type.includes('identifier') && variableType === 'string') {
      usedType = 'identifier';
    } else if (tolerateTypeVariation) {
      if (type.length > 0) {
        usedType = variableType;
      } else {
        usedType = variableType;
      }
    } else {
      throw Error(
        `The current variable (${variableType}) type doesn't match the allowed types (${JSON.stringify(
          type,
        )})`,
      );
    }
  } else {
    if (variableType === type) {
      usedType = type;
    } else if (variableType === 'string' && type === 'identifier') {
      usedType = 'identifier';
    } else if (tolerateTypeVariation) {
      usedType = variableType;
    } else {
      throw Error(
        `The current variable (${variableType}) type doesn't match the allowed type (${type})`,
      );
    }
  }
  switch (usedType) {
    case 'array':
      return arrayExpression(
        (variable as unknown[]).map(v => variableToASTNode(v)),
      );
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
    case 'undefined':
      return identifier(usedType);
    default:
      throw Error(
        `Type ${variableType} for method arguments not implemented yet`,
      );
  }
}

function generateCallExpression(
  callee: Expression,
  scriptAttributes: PartialAttributes,
  schemaAttributes: WyiswygExpressionSchema['properties'],
  tolerateTypeVariation?: boolean,
) {
  return callExpression(
    callee,
    Object.keys(
      omit(scriptAttributes, Object.keys(defaultConditionAttributes)),
    ).map(arg => {
      const numberArg = Number(arg);
      const schemaArg = schemaAttributes[numberArg];
      return variableToASTNode(
        scriptAttributes[numberArg],
        schemaArg ? schemaArg.oldType : undefined,
        tolerateTypeVariation,
      );
    }),
  );
}
function generateExpressionWithInitValue(value: string) {
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
  return callExpression(identifier('undefined'), []);
}

function generateImpactExpression(
  scriptAttributes: IAttributes,
  schemaAttributes: PartialSchemaAttributes,
  tolerateTypeVariation?: boolean,
) {
  return generateCallExpression(
    memberExpression(
      generateExpressionWithInitValue(scriptAttributes.initExpression.script),
      identifier(scriptAttributes.methodName),
    ),
    scriptAttributes,
    schemaAttributes,
    tolerateTypeVariation,
  );
}

function generateConditionStatement(
  scriptAttributes: IConditionAttributes,
  schemaAttributes: PartialSchemaAttributes,
  methodReturn: WegasMethodReturnType,
  tolerateTypeVariation?: boolean,
) {
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
}

/////////////////////////////////////////////
// ALL PURPOSE //////////////////////////////
/////////////////////////////////////////////

export function parseStatement(
  statement: Statement,
  mode?: ScriptMode,
): {
  attributes: Partial<IInitAttributes | IAttributes | IConditionAttributes>;
  error?: string;
} {
  let error: string | undefined = undefined;
  if (
    isExpressionStatement(statement) &&
    isBooleanLiteral(statement.expression)
  ) {
    return {
      attributes: {
        initExpression: {
          type: 'boolean',
          script: statement.expression.value ? 'true' : 'false',
        },
      },
      error,
    };
  } else if (isEmptyStatement(statement)) {
    if (isScriptCondition(mode)) {
      return {
        attributes: {
          initExpression: {
            type: 'boolean',
            script: 'true',
          },
        },
      };
    } else {
      return { attributes: {} };
    }
  } else if (isGlobalMethodCallStatement(statement)) {
    const script = getGlobalMethodScript(statement.expression.callee);
    if (script == null) {
      error = 'The global method is not parsable';
    } else {
      return {
        attributes: {
          initExpression: {
            type: 'global',
            script,
          },
          ...getParameters(statement.expression),
        },
        error,
      };
    }
  } else if (isScriptCondition(mode)) {
    if (isConditionCallStatement(statement)) {
      return {
        attributes: {
          variableName: getVariable(statement.expression),
          initExpression: {
            type: 'variable',
            script: `Variable.find(gameModel,'${getVariable(
              statement.expression,
            )}')`,
          },
          methodName: getMethodName(statement.expression),
          ...getParameters(statement.expression),
        },
        error,
      };
    } else if (isConditionStatement(statement)) {
      return {
        attributes: {
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
        },
        error,
      };
    } else {
      error = 'Cannot be parsed as a condition';
    }
  } else {
    if (isImpactStatement(statement)) {
      return {
        attributes: {
          initExpression: {
            type: 'variable',
            script: `Variable.find(gameModel,'${getVariable(
              statement.expression,
            )}')`,
          },
          methodName: getMethodName(statement.expression),
          ...getParameters(statement.expression),
        },
        error,
      };
    } else {
      error = 'Cannot be parsed as a variable statement';
    }
  }
  return { attributes: defaultInitAttributes, error };
}

export function generateStatement(
  attributes: Partial<IInitAttributes | IAttributes | IConditionAttributes>,
  schema: WyiswygExpressionSchema,
  mode?: ScriptMode,
): Statement | undefined {
  const properties = schema.properties;
  try {
    let newStatement;
    if (attributes.initExpression) {
      if (attributes.initExpression.type === 'global') {
        newStatement = generateMethodStatement(attributes, properties, true);
      } else {
        if (
          isScriptCondition(mode) &&
          isConditionAttributes(attributes) &&
          isConditionSchemaAttributes(properties)
        ) {
          const comparatorExpectedType = properties.comparator.type;
          const comparatorCurrentType = typeof attributes.comparator;
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
        } else {
          if (isAttributes(attributes)) {
            newStatement = expressionStatement(
              generateImpactExpression(attributes, properties, true),
            );
          } else {
            if (isBooleanExpression(attributes)) {
              newStatement = expressionStatement(
                booleanLiteral(attributes.initExpression.script === 'true'),
              );
            }
          }
        }
      }
    }
    return newStatement;
  } catch (e) {
    return undefined;
  }
}
