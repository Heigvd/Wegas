import {
  Expression,
  Literal,
  isIdentifier,
  CallExpression,
  Statement,
  isExpressionStatement,
  isCallExpression,
  isMemberExpression,
  StringLiteral,
  NumericLiteral,
  BinaryExpression,
  isBinaryExpression,
  BooleanLiteral,
  Identifier,
  NullLiteral,
  ArrayExpression,
  ObjectExpression,
  arrayExpression,
  booleanLiteral,
  identifier,
  nullLiteral,
  numericLiteral,
  stringLiteral,
  objectExpression,
  objectProperty,
  callExpression,
  memberExpression,
  expressionStatement,
  binaryExpression,
} from '@babel/types';
import generate from 'babel-generator';
import { omit } from 'lodash-es';
import { parse } from 'babylon';
import {
  WegasOperators,
  IParameterAttributes,
  IParameterSchemaAtributes,
  defaultConditionAttributes,
  IAttributes,
  IConditionAttributes,
} from './expressionEditorHelpers';
import {
  WegasTypeString,
  WegasMethodReturnType,
} from '../../../../editionConfig';

// Variable setter methods
export type ImpactExpression = CallExpression & {
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

export type ImpactStatement = Statement & {
  expression: ImpactExpression;
};

export type ConditionExpression = BinaryExpression & {
  left: CallExpression & ImpactExpression;
  right: {
    value: unknown;
  };
  operator: WegasOperators;
};

export type ConditionStatement = Statement & {
  expression: ConditionExpression;
};

export const isLiteralExpression = (
  expression: Expression,
): expression is Literal =>
  (isIdentifier(expression) && expression.name === 'undefined') ||
  expression.type === 'BooleanLiteral' ||
  expression.type === 'NullLiteral' ||
  expression.type === 'NumericLiteral' ||
  expression.type === 'StringLiteral';

export const isVariableObject = (expression: Expression) =>
  isIdentifier(expression) && expression.name === 'Variable';
export const isFindProperty = (expression: Expression) =>
  isIdentifier(expression) && expression.name === 'find';

export const isImpactStatement = (
  statement: Expression | Statement,
): statement is ImpactStatement =>
  isExpressionStatement(statement) &&
  isCallExpression(statement.expression) &&
  isMemberExpression(statement.expression.callee) &&
  isCallExpression(statement.expression.callee.object) &&
  isMemberExpression(statement.expression.callee.object.callee) &&
  isVariableObject(statement.expression.callee.object.callee.object) &&
  isFindProperty(statement.expression.callee.object.callee.property);

export const getVariable = (expression: ImpactExpression) =>
  expression.callee.object.arguments[1].value;
export const getMethodName = (expression: ImpactExpression) =>
  expression.callee.property.name;

export const listToObject: <T>(list: T[]) => { [id: string]: T } = list =>
  list.reduce((o, p, i) => ({ ...o, [i]: p }), {});

export const getParameters = (expression: CallExpression) =>
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

export const isConditionStatement = (
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

export const getOperator = (expression: ConditionExpression) =>
  expression.operator;

export const getComparator = (expression: ConditionExpression) =>
  expression.right.value;

export const variableToASTNode = (
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
  | StringLiteral => {
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
      arrayExpression((variable as unknown[]).map(v => variableToASTNode(v)));
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
        `Type ${variableType} for method arguments not implemented yet`,
      );
  }
};

export const generateCallExpression = (
  callee: Expression,
  scriptAttributes: IParameterAttributes,
  schemaAttributes: IParameterSchemaAtributes,
  tolerateTypeVariation?: boolean,
) =>
  callExpression(
    callee,
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

export const generateExpressionWithInitValue = (value: string) => {
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

export const generateImpactExpression = (
  scriptAttributes: IAttributes,
  schemaAttributes: IParameterSchemaAtributes,
  tolerateTypeVariation?: boolean,
) =>
  generateCallExpression(
    memberExpression(
      generateExpressionWithInitValue(scriptAttributes.initExpression.script),
      identifier(scriptAttributes.methodName),
    ),
    scriptAttributes,
    schemaAttributes,
    tolerateTypeVariation,
  );

export const generateConditionStatement = (
  scriptAttributes: IConditionAttributes,
  schemaAttributes: IParameterSchemaAtributes,
  methodReturn: WegasMethodReturnType,
  tolerateTypeVariation?: boolean,
) =>
  expressionStatement(
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
