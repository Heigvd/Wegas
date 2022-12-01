import {
  CallExpression,
  callExpression,
  Expression,
  Identifier,
  identifier,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  MemberExpression,
  memberExpression,
  StringLiteral,
  stringLiteral,
  SpreadElement,
} from '@babel/types';

interface VariableAST extends CallExpression {
  callee: {
    object: {
      type: 'Identifier';
      name: 'Variable';
    } & Identifier;
    property: {
      type: 'Identifier';
      name: 'find';
    } & Identifier;
    computed: false;
  } & MemberExpression;
  arguments: [{ name: 'gameModel' } & Identifier, StringLiteral];
}
interface VariableCallAST extends CallExpression {
  callee: {
    object: VariableAST;
    property: Identifier;
  } & MemberExpression;
}
export function isVariable(node: Expression): node is VariableAST {
  return (
    isCallExpression(node) &&
    isMemberExpression(node.callee, { computed: false }) &&
    isIdentifier(node.callee.object, { name: 'Variable' }) &&
    isIdentifier(node.callee.property, { name: 'find' }) &&
    isIdentifier(node.arguments[0], { name: 'gameModel' }) &&
    isStringLiteral(node.arguments[1])
  );
}
export function isVariableCall(node: Expression): node is VariableCallAST {
  return (
    isCallExpression(node) &&
    isMemberExpression(node.callee, { computed: false }) &&
    isVariable(node.callee.object) &&
    isIdentifier(node.callee.property)
  );
}
export function variableName(node: VariableAST) {
  return node.arguments[1].value;
}

export function createVariableAST(name: string) {
  return callExpression(
    memberExpression(identifier('Variable'), identifier('find')),
    [identifier('gameModel'), stringLiteral(name)],
  ) as VariableAST;
}

export function createVariableCallAST(
  name: string,
  method: string,
  args: (Expression | SpreadElement)[],
) {
  return callExpression(
    memberExpression(createVariableAST(name), identifier(method)),
    args,
  );
}
