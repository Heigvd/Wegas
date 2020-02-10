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
  program,
  isExpressionStatement,
  isCallExpression,
  isMemberExpression,
  Node,
  expressionStatement,
} from '@babel/types';
import generate from 'babel-generator';
import { parse } from 'babylon';
import { wlog } from '../../../../../Helper/wegaslog';
import {
  IInitAttributes,
  IParameterAttributes,
  IParameterSchemaAtributes,
} from './expressionEditorHelpers';
import { generateCallExpression } from './astVariableManagement';

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
    parser: (expression: Identifier) => expression.name,
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

export function methodParameterParse(node: Node | null) {
  for (const entry of Object.entries(allowedArgumentTypes)) {
    const typeMethods = entry[1];
    if (typeMethods.checker(node)) {
      // @ts-ignore we can ignore the ts error here as we ensured the node's type with the checker
      return typeMethods.parser(node, methodParameterParse);
    }
  }
  throw Error(`Argument's node ${JSON.stringify(node)} cannot be parsed`);
}

export function methodParse(
  statement: Statement,
  ignoredStartingIdentifier?: string,
): IInitAttributes | undefined {
  function throwParseError(message: string) {
    const { code } = generate(program([statement]));
    throw Error(`${message} :\n${code}`);
  }

  try {
    if (!isExpressionStatement(statement)) {
      throwParseError('The statement is not an expression statement');
    } else {
      const expression = statement.expression;
      if (!isCallExpression(expression)) {
        throwParseError('The first expression is not a call expression');
      } else {
        const parameters: IParameterAttributes = expression.arguments
          .map(methodParameterParse)
          .reduce((o, a, i) => ({ ...o, [i]: a }), {});
        let callee = expression.callee;
        let initMethod = '';
        while (isMemberExpression(callee)) {
          if (isIdentifier(callee.property)) {
            initMethod = '.' + callee.property.name + initMethod;
          } else {
            throwParseError(
              `The member's property of ${initMethod} must be of type identifier`,
            );
          }
          callee = callee.object;
        }
        if (isIdentifier(callee)) {
          if (callee.name !== ignoredStartingIdentifier) {
            return {
              ...parameters,
              initExpression: {
                type: 'global',
                script: callee.name + initMethod,
              },
            };
          } else {
            throwParseError(
              `A method starting with ${ignoredStartingIdentifier} is ignored`,
            );
          }
        } else {
          throwParseError(
            `The last member of ${initMethod} must be of type identifier`,
          );
        }
      }
    }
  } catch (e) {
    wlog('Method parser error');
    wlog(e);
  }
}

export const generateMethodStatement = (
  scriptAttributes: IInitAttributes,
  schemaAttributes: IParameterSchemaAtributes,
  tolerateTypeVariation?: boolean,
) => {
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
  return expressionStatement();
};
