import { parse } from '@babel/parser';
import {
  arrayExpression,
  ArrayExpression,
  booleanLiteral,
  BooleanLiteral,
  CallExpression,
  identifier,
  Identifier,
  isArrayExpression,
  isBinaryExpression,
  isBooleanLiteral,
  isCallExpression,
  isEmptyStatement,
  isExpressionStatement,
  isIdentifier,
  isImportDeclaration,
  isLogicalExpression,
  isMemberExpression,
  isNullLiteral,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  isUnaryExpression,
  Node,
  nullLiteral,
  numericLiteral,
  NumericLiteral,
  objectExpression,
  ObjectExpression,
  objectProperty,
  ObjectProperty,
  Statement,
  stringLiteral,
  StringLiteral,
  UnaryExpression,
} from '@babel/types';
import { isClientMode, isScriptCondition } from '../Script';
import {
  Attributes,
  CommonExpressionAttributes,
  GlobalExpressionAttributes,
  isWegasBooleanOperator,
  LeftExpressionAttributes,
  VariableExpressionAttributes,
  WegasOperators,
  WyiswygExpressionSchema,
} from './expressionEditorHelpers';

function pushExpressionToStatementArray(
  statementArray: string[],
  code: string,
  expression: Node,
  mode: 'push' | 'unshift' = 'push',
) {
  if (expression.start != null && expression.end != null) {
    statementArray[mode](code.slice(expression.start, expression.end));
  }
}

export function parseCodeIntoExpressions(
  code: string,
  mode: ScriptMode | undefined,
): string[] {
  const astStatements = parse(code, {
    sourceType: isClientMode(mode) ? 'module' : 'script',
  }).program.body;

  //Check for import statements
  for (const statement of astStatements) {
    if (isImportDeclaration(statement)) {
      throw 'Cannot use wysiwyg editor with import declarations';
    }
  }

  const newStatements: string[] = [];
  if (isScriptCondition(mode)) {
    const statement = astStatements[0];
    if (isExpressionStatement(statement)) {
      let expression = statement.expression;
      while (isLogicalExpression(expression)) {
        const rightExpression = expression.right;
        pushExpressionToStatementArray(
          newStatements,
          code,
          rightExpression,
          'unshift',
        );
        expression = expression.left;
      }
      pushExpressionToStatementArray(
        newStatements,
        code,
        expression,
        'unshift',
      );
    }
  } else {
    astStatements.map(ast => {
      pushExpressionToStatementArray(newStatements, code, ast);
    });
  }
  return newStatements;
}

const allowedArgumentTypes = {
  array: {
    checker: isArrayExpression,
    generator: arrayExpression,
    parser: (
      expression: ArrayExpression,
      parser: (node: Node | null | undefined) => unknown,
    ) => expression.elements.map(parser),
  },
  boolean: {
    checker: isBooleanLiteral,
    generator: booleanLiteral,
    parser: (expression: BooleanLiteral): boolean => expression.value,
  },
  identifier: {
    checker: isIdentifier,
    generator: identifier,
    parser: (expression: Identifier): string | undefined =>
      expression.name === 'undefined' ? undefined : expression.name,
  },
  null: {
    checker: isNullLiteral,
    generator: nullLiteral,
    parser: (): null => null,
  },
  number: {
    checker: isNumericLiteral,
    generator: numericLiteral,
    parser: (expression: NumericLiteral): number => expression.value,
  },
  prefixedNumber: {
    checker: (
      node: object | null | undefined,
      opts?: object | null | undefined,
    ) => isUnaryExpression(node, opts) && isNumericLiteral(node.argument),
    generator: numericLiteral,
    parser: (
      expression: UnaryExpression & { argument: NumericLiteral },
    ): number =>
      expression.operator === '-'
        ? -expression.argument.value
        : expression.argument.value,
  },
  string: {
    checker: isStringLiteral,
    generator: stringLiteral,
    parser: (expression: StringLiteral): string => expression.value,
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

function methodParameterParse(node: Node | null | undefined) {
  if (node === undefined) {
    return undefined;
  } else {
    for (const typeMethods of Object.values(allowedArgumentTypes)) {
      if (typeMethods.checker(node)) {
        return typeMethods.parser(node as any, methodParameterParse);
      }
    }
    throw Error(`Argument's node ${node?.type} cannot be parsed`);
  }
}

export type LiteralExpressionValue =
  | string
  | boolean
  | number
  | undefined
  | null
  | object;

function parseVariableFindExpression(
  expression: CallExpression,
):
  | ({ expression: VariableExpressionAttributes } & CommonExpressionAttributes)
  | undefined {
  const variableMethodCalee = expression.callee;
  const variableMethodArguments = expression.arguments;
  if (isMemberExpression(variableMethodCalee)) {
    const variableMethodCaleeObject = variableMethodCalee.object;
    const variableMethodCaleeProperty = variableMethodCalee.property;
    if (isCallExpression(variableMethodCaleeObject)) {
      const variableFindCalee = variableMethodCaleeObject.callee;
      const variableFindArguments = variableMethodCaleeObject.arguments;
      if (isMemberExpression(variableFindCalee)) {
        const variableFindObject = variableFindCalee.object;
        const variableFindProperty = variableFindCalee.property;
        if (
          isIdentifier(variableFindObject) &&
          variableFindObject.name === 'Variable' &&
          isIdentifier(variableFindProperty) &&
          variableFindProperty.name === 'find'
        ) {
          if (variableFindArguments.length === 2) {
            const gameModelArgument = variableFindArguments[0];
            const variableNameArgument = variableFindArguments[1];
            if (
              isIdentifier(gameModelArgument) &&
              gameModelArgument.name === 'gameModel' &&
              isStringLiteral(variableNameArgument) &&
              isIdentifier(variableMethodCaleeProperty)
            ) {
              let attributesArguments: LiteralExpressionValue[] = [];
              if (variableMethodArguments.length >= 2) {
                const selfArgument = variableMethodArguments[0];
                const valueArguments = variableMethodArguments
                  .slice(1)
                  .map(methodParameterParse);
                if (
                  isIdentifier(selfArgument) &&
                  selfArgument.name === 'self'
                ) {
                  attributesArguments = ['self', ...valueArguments];
                }
              }
              return {
                expression: {
                  type: 'variable',
                  variableName: variableNameArgument.value,
                },
                methodId: variableMethodCaleeProperty.name,
                arguments: attributesArguments,
              };
            }
          }
        }
      }
    } else if (
      isIdentifier(variableMethodCaleeObject) &&
      variableMethodCaleeObject.name === 'Variable' &&
      isIdentifier(variableMethodCaleeProperty) &&
      variableMethodCaleeProperty.name === 'find' &&
      variableMethodArguments.length === 2
    ) {
      const variableNameNode = variableMethodArguments[1];
      if (isStringLiteral(variableNameNode)) {
        return {
          expression: {
            type: 'variable',
            variableName: variableNameNode.value,
          },
        };
      }
    }
  }
  return undefined;
}

function parseGlobalMethodExpression(
  callExpression: CallExpression,
  mode?: ScriptMode,
):
  | ({ expression: GlobalExpressionAttributes } & CommonExpressionAttributes)
  | string {
  // Global method are not yet allowed in client scripts
  if (!isClientMode(mode)) {
    let expression = callExpression.callee;
    const objectChain: string[] = [];

    while (
      isMemberExpression(expression) &&
      isIdentifier(expression.property)
    ) {
      objectChain.unshift(expression.property.name);
      expression = expression.object;
    }
    if (isIdentifier(expression)) {
      objectChain.unshift(expression.name);
      return {
        expression: {
          type: 'global',
          globalObject: objectChain.join('.'),
        },
        arguments: callExpression.arguments.map(methodParameterParse),
      };
    } else {
      return 'Cannot parse code as Global or Variable Method';
    }
  } else {
    return 'Global methods cannot be used in client scripts';
  }
}

function parseCallStatement(
  callExpression: CallExpression,
  mode: ScriptMode | undefined,
  operator?: WegasOperators,
  right?: Node,
): Attributes | string {
  const type = isScriptCondition(mode) ? 'condition' : 'impact';
  const variableExpressionAttributes =
    parseVariableFindExpression(callExpression);
  if (variableExpressionAttributes != null) {
    return {
      type,
      ...(type === 'condition'
        ? { leftExpression: variableExpressionAttributes.expression }
        : { expression: variableExpressionAttributes.expression }),
      methodId: variableExpressionAttributes.methodId,
      arguments: variableExpressionAttributes.arguments,
      booleanOperator: operator,
      rightExpression: methodParameterParse(right),
    };
  } else {
    const globalExpressionAttributes = parseGlobalMethodExpression(
      callExpression,
      mode,
    );
    if (typeof globalExpressionAttributes === 'string') {
      return globalExpressionAttributes;
    } else {
      return {
        type,
        ...(type === 'condition'
          ? { leftExpression: globalExpressionAttributes.expression }
          : { expression: globalExpressionAttributes.expression }),
        methodId: globalExpressionAttributes.methodId,
        arguments: globalExpressionAttributes.arguments,
        booleanOperator: operator,
      };
    }
  }
}

export function parseStatement(
  statement: Statement,
  mode?: ScriptMode,
): Attributes {
  let error: string | undefined = undefined;
  // If statement is empty, set value as true
  if (isEmptyStatement(statement)) {
    if (isScriptCondition(mode)) {
      return {
        type: 'condition',
        leftExpression: {
          type: 'literal',
          literal: true,
        },
      };
    } else {
      return {
        type: 'impact',
      };
    }
  } else if (isExpressionStatement(statement)) {
    const expression = statement.expression;
    let type: NonNullable<Attributes>['type'];
    if (isScriptCondition(mode)) {
      type = 'condition';
      // If statement is boolean literal, use its value
      // Example : true
      if (isBooleanLiteral(expression)) {
        return {
          type,
          leftExpression: {
            type: 'literal',
            literal: expression.value,
          },
        };
      }
      //Example : LeftExpression.call() === 123
      else if (isBinaryExpression(expression)) {
        const left = expression.left;
        const right = expression.right;
        const operator = expression.operator;

        // Left part must be a call expression
        // Operator must be a known operator
        // Right part must be a literal or the "undefined" identifier
        if (isCallExpression(left)) {
          if (isWegasBooleanOperator(operator)) {
            const parsedAttributes = parseCallStatement(
              left,
              mode,
              operator,
              right,
            );
            if (typeof parsedAttributes === 'string') {
              error = parsedAttributes;
            } else {
              return parsedAttributes;
            }
          } else {
            error = `The use boolean operator (${operator})cannot be parsed`;
          }
        }
      }
      //Example : Expression.call()
      else if (isCallExpression(expression)) {
        const parsedAttributes = parseCallStatement(expression, mode, 'isTrue');
        if (typeof parsedAttributes === 'string') {
          error = parsedAttributes;
        } else {
          return parsedAttributes;
        }
      }
      //Example : !Expression.call()
      else if (isUnaryExpression(expression)) {
        if (
          expression.operator === '!' &&
          isCallExpression(expression.argument)
        ) {
          const parsedAttributes = parseCallStatement(
            expression.argument,
            mode,
            'isFalse',
          );
          if (typeof parsedAttributes === 'string') {
            error = parsedAttributes;
          } else {
            return parsedAttributes;
          }
        } else {
          error = 'The only allowed unary expression operator is !';
        }
      } else {
        error =
          'The script cannot be parsed as a known condition expression (empty, boolean literal or binary expression)';
      }
    } else {
      type = 'impact';
      if (isCallExpression(expression)) {
        const parsedAttributes = parseCallStatement(expression, mode);
        if (typeof parsedAttributes === 'string') {
          error = parsedAttributes;
        } else {
          return parsedAttributes;
        }
      } else {
        error = 'The script cannot be parsed as an impact expression';
      }
    }
  } else {
    error = 'The script cannot be parsed as an expression';
  }

  // If statement does not comply to previous tests, the editor is not able to parse and set an error
  throw error;
}

function leftExpressionToCode(expression: LeftExpressionAttributes): string {
  switch (expression.type) {
    case 'global':
      return expression.globalObject;
    case 'variable':
      return `Variable.find(gameModel, '${expression.variableName}')`;
    case 'literal':
      return String(expression.literal);
  }
}

function methodAndArgsToCode(
  attributes: NonNullable<Attributes>,
  schema: WyiswygExpressionSchema | undefined,
): string {
  let newCode = '';
  const expression =
    attributes.type === 'condition'
      ? attributes.leftExpression
      : attributes.expression;
  if (
    (expression?.type === 'variable' && attributes?.methodId != null) ||
    expression?.type === 'global'
  ) {
    if (attributes?.methodId != null) {
      newCode += `.${attributes.methodId}`;
    }
    newCode += '(';
    if (
      attributes.arguments != null &&
      schema?.properties.arguments?.properties != null
    ) {
      const schemaProperties = schema.properties.arguments.properties;
      newCode += attributes.arguments
        .map((arg, i) => {
          const realType = schemaProperties[i].view?.oldType;
          if (realType === 'identifier' && typeof arg === 'string') {
            return arg;
          } else if (typeof arg === 'undefined') {
            return typeof arg;
          } else {
            return JSON.stringify(arg);
          }
        })
        .join(', ');
    }
    newCode += ')';
  }
  return newCode;
}

export function generateCode(
  attributes: NonNullable<Attributes>,
  schema: WyiswygExpressionSchema | undefined,
): string {
  let newCode = '';
  if (attributes.type === 'impact') {
    if (attributes.expression != null) {
      newCode +=
        leftExpressionToCode(attributes.expression) +
        methodAndArgsToCode(attributes, schema);
    }
    return newCode;
  } else {
    if (attributes.leftExpression != null) {
      newCode +=
        leftExpressionToCode(attributes.leftExpression) +
        methodAndArgsToCode(attributes, schema);
      if (
        attributes.booleanOperator != null &&
        attributes.booleanOperator != 'isTrue' &&
        attributes.booleanOperator != 'isFalse' &&
        attributes.rightExpression != null
      ) {
        newCode += ` ${attributes.booleanOperator} ${attributes.rightExpression}`;
      } else if (attributes.booleanOperator === 'isFalse') {
        newCode = '!' + newCode;
      }
    }
    return newCode;
  }
}
