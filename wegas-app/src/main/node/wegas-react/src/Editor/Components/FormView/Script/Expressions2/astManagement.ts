import {
  arrayExpression,
  ArrayExpression,
  BinaryExpression,
  booleanLiteral,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  identifier,
  Identifier,
  isArrayExpression,
  isBinaryExpression,
  isBooleanLiteral,
  isCallExpression,
  isEmptyStatement,
  isExpressionStatement,
  isIdentifier,
  isMemberExpression,
  isNullLiteral,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isPrivateName,
  isStringLiteral,
  isUnaryExpression,
  Literal,
  MemberExpression,
  Node,
  nullLiteral,
  NullLiteral,
  numericLiteral,
  NumericLiteral,
  objectExpression,
  ObjectExpression,
  objectProperty,
  ObjectProperty,
  PrivateName,
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
  LiteralExpressionAttributes,
  LiteralExpressionValue,
  VariableExpressionAttributes,
  WegasOperators,
} from './expressionEditorHelpers';

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
  prefixedNumber: {
    checker: (
      node: object | null | undefined,
      opts?: object | null | undefined,
    ) => isUnaryExpression(node, opts) && isNumericLiteral(node.argument),
    generator: numericLiteral,
    parser: (expression: UnaryExpression & { argument: NumericLiteral }) =>
      expression.operator === '-'
        ? -expression.argument.value
        : expression.argument.value,
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
      return typeMethods.parser(node as any, methodParameterParse);
    }
  }
  throw Error(`Argument's node ${node?.type} cannot be parsed`);
}

// const generateMethodStatement = (
//   scriptAttributes: PartialAttributes,
//   schemaAttributes: WyiswygExpressionSchema['properties'],
//   tolerateTypeVariation?: boolean,
// ) => {
//   if (scriptAttributes.initExpression) {
//     const initStatement = parse(scriptAttributes.initExpression.script, {
//       sourceType: 'script',
//     }).program.body[0];
//     if (isExpressionStatement(initStatement)) {
//       const expression = initStatement.expression;
//       if (isMemberExpression(expression) || isIdentifier(initStatement)) {
//         return expressionStatement(
//           generateCallExpression(
//             expression,
//             scriptAttributes,
//             schemaAttributes,
//             tolerateTypeVariation,
//           ),
//         );
//       }
//     }
//   }
//   return emptyStatement();
// };

/////////////////////////////////////////////
// VARIABLES METHODS ////////////////////////
/////////////////////////////////////////////

/**
 * Variable.find(gameModel, "x").getValue(self, "a", 2)
 */
type ImpactExpression = CallExpression & {
  // Variable.find(gameModel, "x").getValue
  callee: MemberExpression & {
    // Variable.find(gameModel, "x")
    object: CallExpression & {
      // Variable.find
      callee: MemberExpression;
      // gameModel, "varName"
      arguments: [Identifier, StringLiteral];
    };
    // getValue
    property: Identifier;
  };
  // [self, "a", 2]
  arguments: Expression[];
};

type ImpactStatement = Statement & {
  expression: ImpactExpression;
};

type ConditionExpression = BinaryExpression & {
  left: ImpactExpression;
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
    // Variable.find(gm, "x").getValue(self)
    isCallExpression(statement.expression) &&
    // Variable.find(gm, "x").getValue
    isMemberExpression(statement.expression.callee) &&
    // getValue
    isIdentifier(statement.expression.callee.property) &&
    // Variable.find(gm, "x")
    isCallExpression(statement.expression.callee.object) &&
    // Variable.find
    isMemberExpression(statement.expression.callee.object.callee) &&
    // Variable
    isVariableObject(statement.expression.callee.object.callee.object) &&
    // find
    isFindProperty(statement.expression.callee.object.callee.property) &&
    // [gameModel, 'varName']
    statement.expression.callee.object.arguments.length >= 0 &&
    // gameModel
    isIdentifier(statement.expression.callee.object.arguments[0]) &&
    // varName
    isStringLiteral(statement.expression.callee.object.arguments[1])
  );
}

function getVariable(expression: ImpactExpression) {
  return expression.callee.object.arguments[1].value;
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

// function generateCallExpression(
//   callee: Expression,
//   scriptAttributes: PartialAttributes,
//   schemaAttributes: SchemaProperties,
//   tolerateTypeVariation?: boolean,
// ) {
//   return callExpression(
//     callee,
//     Object.keys(
//       omit(scriptAttributes, Object.keys(defaultConditionAttributes)),
//     ).map(arg => {
//       const numberArg = Number(arg);
//       const schemaArg = schemaAttributes[numberArg];
//       return variableToASTNode(
//         scriptAttributes[numberArg],
//         schemaArg ? schemaArg.oldType : undefined,
//         tolerateTypeVariation,
//       );
//     }),
//   );
// }
// function generateExpressionWithInitValue(value: string) {
//   const parsedStatements = parse(value, {
//     sourceType: 'script',
//   }).program.body;
//   if (parsedStatements.length > 0) {
//     const parsedStatement = parsedStatements[0];
//     if (isExpressionStatement(parsedStatement)) {
//       const parsedExpression = parsedStatement.expression;
//       if (isCallExpression(parsedExpression)) {
//         return parsedExpression;
//       }
//     }
//   }
//   return callExpression(identifier('undefined'), []);
// }

// function generateImpactExpression(
//   scriptAttributes: IAttributes,
//   schemaAttributes: PartialSchemaAttributes,
//   tolerateTypeVariation?: boolean,
// ) {
//   return generateCallExpression(
//     memberExpression(
//       generateExpressionWithInitValue(scriptAttributes.initExpression.script),
//       identifier(scriptAttributes.methodName),
//     ),
//     scriptAttributes,
//     schemaAttributes,
//     tolerateTypeVariation,
//   );
// }

// function generateConditionStatement(
//   scriptAttributes: IConditionAttributes,
//   schemaAttributes: PartialSchemaAttributes,
//   methodReturn: WegasMethodReturnType,
//   tolerateTypeVariation?: boolean,
// ) {
//   return expressionStatement(
//     binaryExpression(
//       scriptAttributes.operator,
//       generateImpactExpression(
//         scriptAttributes,
//         schemaAttributes,
//         tolerateTypeVariation,
//       ),
//       variableToASTNode(
//         scriptAttributes.comparator,
//         methodReturn,
//         tolerateTypeVariation,
//       ),
//     ),
//   );
// }

/////////////////////////////////////////////
// ALL PURPOSE //////////////////////////////
/////////////////////////////////////////////

type WegasAllowedLiteral =
  | StringLiteral
  | BooleanLiteral
  | NumericLiteral
  | Identifier;

export function isWegasAllowedLiteral(
  expression: any,
): expression is WegasAllowedLiteral {
  return (
    isStringLiteral(expression) ||
    isBooleanLiteral(expression) ||
    isNumericLiteral(expression) ||
    isIdentifier(expression, { name: 'undefined' })
  );
}

export type LiteralExpressionValue = string | boolean | number | undefined;

function parseLiteralExpression(
  expression: WegasAllowedLiteral,
): LiteralExpressionValue {
  switch (expression.type) {
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NumericLiteral':
      return expression.value;
    default:
      return undefined;
  }
}

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
                  .filter(isWegasAllowedLiteral)
                  .map(parseLiteralExpression);
                if (
                  isIdentifier(selfArgument) &&
                  selfArgument.name === 'self'
                ) {
                  attributesArguments = valueArguments;
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
    }
  }
  return undefined;
}

function parseGlobalMethodExpression(
  callExpression: CallExpression,
  mode?: ScriptMode,
):
  | ({ expression: GlobalExpressionAttributes } & CommonExpressionAttributes)
  | undefined {
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
        arguments: callExpression.arguments
          .filter(isWegasAllowedLiteral)
          .map(parseLiteralExpression),
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
      if (isBooleanLiteral(expression)) {
        return {
          type,
          leftExpression: {
            type: 'literal',
            literal: expression.value,
          },
        };
      } else if (isBinaryExpression(expression)) {
        const left = expression.left;
        const right = expression.right;
        const operator = expression.operator;

        // Left part must be a call expression
        // Operator must be a known operator
        // Right part must be a literal or the "undefined" identifier
        if (isCallExpression(left)) {
          if (isWegasBooleanOperator(operator)) {
            if (isWegasAllowedLiteral(right)) {
              // Try to get the variable name in case the expression is a Variable.find call
              const variableExpressionAttributes =
                parseVariableFindExpression(left);
              if (variableExpressionAttributes != null) {
                return {
                  type,
                  leftExpression: variableExpressionAttributes.expression,
                  methodId: variableExpressionAttributes.methodId,
                  arguments: variableExpressionAttributes.arguments,
                  booleanOperator: operator,
                  rightExpression: parseLiteralExpression(right),
                };
              } else {
                const globalExpressionAttributes = parseGlobalMethodExpression(
                  left,
                  mode,
                );
                if (globalExpressionAttributes != null) {
                  return {
                    type,
                    ...globalExpressionAttributes,
                  };
                }
                error = 'Cannot parse code as Global or Variable Method';
                // const objectChain: string[] = [];
                // let expression = left.callee;
                // while (
                //   isMemberExpression(expression) &&
                //   isIdentifier(expression.property)
                // ) {
                //   objectChain.unshift(expression.property.name);
                //   expression = expression.object;
                // }

                // return {
                //   type: 'condition',
                //   leftExpression: {
                //     type: 'global',
                //     globalObject:
                //       objectChain.join('.') +
                //       `(${left.arguments
                //         .map(arg => {
                //           if (isWegasAllowedLiteral(arg)) {
                //             return isLiteral(arg)
                //               ? String(arg.value)
                //               : 'undefined';
                //           } else {
                //             throw 'One of the argument is not parsable';
                //           }
                //         })
                //         .join(',')})`,
                //   },
                // };
              }
            } else {
              error =
                'The right part must be a literal (boolean, string or number) or undefined';
            }
          } else {
            error = `The use boolean operator (${operator})cannot be parsed`;
          }
        }
      } else {
        error =
          'The script cannot be parsed as a known expression (empty, boolean literal or binary expression)';
      }
    } else {
      type = 'impact';
      if (isCallExpression(expression)) {
        const variableExpressionAttributes =
          parseVariableFindExpression(expression);
        if (variableExpressionAttributes) {
          return {
            type,
            expression: variableExpressionAttributes.expression,
            methodId: variableExpressionAttributes.methodId,
            arguments: variableExpressionAttributes.arguments,
          };
        } else {
          const globalExpressionAttributes = parseGlobalMethodExpression(
            expression,
            mode,
          );
          if (globalExpressionAttributes != null) {
            return {
              type,
              ...globalExpressionAttributes,
            };
          }
          error = 'Cannot parse code as Global or Variable Method';
        }
      }
    }
  } else {
    error = 'The script cannot be parsed as an expression';
  }

  // If statement does not comply to previous tests, the editor is not able to parse and set an error
  throw error;
}

// export function generateStatement(
//   attributes: Attributes,
//   schema: WyiswygExpressionSchema,
//   mode?: ScriptMode,
// ): Statement | undefined {
//   const properties = schema.properties;
//   try {
//     let newStatement: EmptyStatement | ExpressionStatement | undefined;
//     if (attributes.initExpression) {
//       if (attributes.initExpression.type === 'global') {
//         newStatement = generateMethodStatement(attributes, properties, true);
//       } else {
//         if (
//           isScriptCondition(mode) &&
//           isConditionAttributes(attributes) &&
//           isConditionSchemaAttributes(properties)
//         ) {
//           const comparatorExpectedType = properties.comparator.type;
//           const comparatorCurrentType = typeof attributes.comparator;
//           newStatement = generateConditionStatement(
//             attributes,
//             properties,
//             comparatorExpectedType
//               ? comparatorExpectedType
//               : isWegasMethodReturnType(comparatorCurrentType)
//               ? comparatorCurrentType
//               : 'string',
//             true,
//           );
//         } else {
//           if (isAttributes(attributes)) {
//             newStatement = expressionStatement(
//               generateImpactExpression(attributes, properties, true),
//             );
//           } else {
//             if (isBooleanExpression(attributes)) {
//               newStatement = expressionStatement(
//                 booleanLiteral(attributes.initExpression.script === 'true'),
//               );
//             }
//           }
//         }
//       }
//     }
//     return newStatement;
//   } catch (e) {
//     return undefined;
//   }
// }

function leftExpressionToCode(
  expression:
    | LiteralExpressionAttributes
    | GlobalExpressionAttributes
    | VariableExpressionAttributes,
): string {
  switch (expression.type) {
    case 'global':
      return expression.globalObject;
    case 'variable':
      return `Variable.find(gamemodel,${expression.variableName})`;
    case 'literal':
      return String(expression.literal);
  }
}

function methodAndArgsToCode(attributes: NonNullable<Attributes>): string {
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
    if (attributes.arguments != null) {
      newCode += attributes.arguments.map(arg => arg?.toString).join(',');
    }
    newCode += ');';
  }
  return newCode;
}

export function generateCode(attributes: NonNullable<Attributes>): string {
  let newCode = '';
  if (attributes.type === 'impact') {
    if (attributes.expression != null) {
      newCode +=
        leftExpressionToCode(attributes.expression) +
        methodAndArgsToCode(attributes);
    }
    return newCode;
  } else {
    if (attributes.leftExpression != null) {
      newCode +=
        leftExpressionToCode(attributes.leftExpression) +
        methodAndArgsToCode(attributes);
      if (
        attributes.booleanOperator != null &&
        attributes.rightExpression != null
      ) {
        newCode += ` ${attributes.booleanOperator} ${attributes.rightExpression}`;
      }
    }
    return newCode;
  }
}
