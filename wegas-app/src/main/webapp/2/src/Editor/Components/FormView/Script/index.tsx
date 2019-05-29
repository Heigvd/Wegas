import generate from '@babel/generator';
import { parse } from '@babel/parser';
import {
  booleanLiteral,
  emptyStatement,
  EmptyStatement,
  Expression,
  expressionStatement,
  ExpressionStatement,
  isBooleanLiteral,
  isEmptyStatement,
  isExpressionStatement,
  isLogicalExpression,
  logicalExpression,
  program,
  Statement,
} from '@babel/types';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { IconButton } from '../../../../Components/Button/IconButton';
import SrcEditor from '../../SrcEditor';
import { CommonView, CommonViewContainer } from '../commonView';
import { Labeled, LabeledView } from '../labeled';
import { Statements } from './Statements';

function literalToExpression(expr: Expression) {
  return isBooleanLiteral(expr, { value: true })
    ? emptyStatement()
    : expressionStatement(expr);
}
function logicalToList(expression: Expression): Statement[] {
  if (isLogicalExpression(expression, { operator: '&&' })) {
    if (isLogicalExpression(expression.left)) {
      return logicalToList(expression.left).concat([
        literalToExpression(expression.right),
      ]);
    }
    return [
      literalToExpression(expression.left),
      literalToExpression(expression.right),
    ];
  }
  return [literalToExpression(expression)];
}

function listToLogical(
  expressions: (ExpressionStatement | EmptyStatement)[],
): ExpressionStatement | undefined {
  switch (expressions.length) {
    case 0:
      return;
    case 1: {
      const exp = expressions[0];
      if (isEmptyStatement(exp)) {
        return expressionStatement(booleanLiteral(true));
      }
      return exp;
    }
    default: {
      let last = expressions.pop()!;
      if (isEmptyStatement(last)) {
        last = expressionStatement(booleanLiteral(true));
      }
      const left = listToLogical(expressions)!;

      return expressionStatement(
        logicalExpression('&&', left.expression, last.expression),
      );
    }
  }
}
function scriptObject(script?: string | IScript | null) {
  return typeof script === 'object' && script != null
    ? script.content
    : script || '';
}
interface ScriptBodyProps {
  script?: IScript | string | null;
  onChange: (script: IScript) => void;
  mode: 'GET' | 'SET';
  children: (props: {
    ast: Statement[];
    onChange: (ast: Statement[]) => void;
  }) => JSX.Element;
}
function ScriptBody({ script, onChange, children, mode }: ScriptBodyProps) {
  const code = scriptObject(script);
  const ast = parse(code, { sourceType: 'script' }).program.body;
  function transform(ast: Statement[]) {
    let updted;
    if (mode === 'SET') {
      updted = ast;
    } else {
      if (
        ast.some(
          stmt => !(isExpressionStatement(stmt) || isEmptyStatement(stmt)),
        )
      ) {
        throw Error('Unhandled');
      }
      // ast is (ExpressionStatement|EmptyStatement)[]
      updted = [
        listToLogical((ast as any) as (ExpressionStatement | EmptyStatement)[]),
      ].filter(v => v !== undefined) as Statement[];
    }
    onChange({
      '@class': 'Script',
      language: 'JavaScript',
      content: generate(program(updted)).code,
    });
  }
  const fstStmt = ast[0];
  if (mode === 'GET' && isExpressionStatement(fstStmt)) {
    return children({
      ast: logicalToList(fstStmt.expression),
      onChange: transform,
    });
  }
  return children({
    ast: ast,
    onChange: transform,
  });
}

interface ScriptProps
  extends WidgetProps.BaseProps<
    LabeledView & CommonView & { mode?: 'SET' | 'GET' }
  > {
  value?: string | IScript;

  onChange: (code: IScript) => void;
}
interface ScriptState {
  srcMode: boolean;
  error?: string;
  oldProps: ScriptProps;
}
export class Script extends React.Component<ScriptProps, ScriptState> {
  static getDerivedStateFromProps(nextProps: ScriptProps, state: ScriptState) {
    if (state.oldProps === nextProps) {
      return null;
    }
    return { oldProps: nextProps, error: undefined };
  }
  state: ScriptState = {
    oldProps: this.props,
    srcMode: false,
    error: undefined,
  };
  toggleSrc = () => {
    this.setState(s => ({ srcMode: !s.srcMode }));
  };
  componentDidCatch(error: Error) {
    this.setState({ srcMode: true, error: error.message });
  }
  render() {
    const props = this.props;
    const mode = this.props.view.mode || 'SET';
    return (
      <CommonViewContainer
        view={props.view}
        errorMessage={
          this.state.error ? [this.state.error] : props.errorMessage
        }
      >
        <Labeled {...props.view}>
          {({ labelNode }) => (
            <>
              {labelNode}
              <IconButton
                icon="code"
                pressed={this.state.srcMode}
                onClick={this.toggleSrc}
              />
              {this.state.srcMode ? (
                <div
                  style={{
                    height: '5em',
                  }}
                >
                  <SrcEditor
                    value={scriptObject(props.value)}
                    onChange={v =>
                      props.onChange({
                        '@class': 'Script',
                        language: 'JavaScript',
                        content: v,
                      })
                    }
                  />
                </div>
              ) : (
                <ScriptBody
                  script={props.value}
                  onChange={props.onChange}
                  mode={mode}
                >
                  {({ ast, onChange }) => (
                    <Statements
                      statements={ast}
                      onChange={onChange}
                      mode={mode}
                    />
                  )}
                </ScriptBody>
              )}
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
