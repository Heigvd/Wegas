import * as React from 'react';
import { Statement, Expression, CallExpression } from '@babel/types';
import { ExpressionStatement } from '@babel/types';
import { MemberExpression } from '@babel/types';
import { Identifier } from '@babel/types';
import { ScriptView } from './Script';
import { wlog } from '../../../../Helper/wegaslog';
import { getMethodConfig, WegasMethod } from '../../../editionConfig';
import { useVariableDescriptor } from '../../../../Components/Hooks/useVariable';
import { schemaProps } from '../../../../Components/PageComponents/schemaProps';
import Form from 'jsoninput';
import { css } from 'emotion';

const expressionEditorStyle = css({
  marginTop: '0.8em',
  div: {
    marginTop: '0',
  },
});

const isExpression = (statement: Statement): statement is ExpressionStatement =>
  statement.type === 'ExpressionStatement';
const isCallExpression = (
  expression: Expression,
): expression is CallExpression => expression.type === 'CallExpression';
const isMemberExpression = (
  expression: Expression,
): expression is MemberExpression => expression.type === 'MemberExpression';
const isIdentifier = (expression: Expression): expression is Identifier =>
  expression.type === 'Identifier';
const isVariableObject = (expression: Expression) =>
  isIdentifier(expression) && expression.name === 'Variable';
const isFindProperty = (expression: Expression) =>
  isIdentifier(expression) && expression.name === 'find';
const isVariableFinder = (statement: Statement) =>
  isExpression(statement) &&
  isCallExpression(statement.expression) &&
  isMemberExpression(statement.expression.callee) &&
  isVariableObject(statement.expression.callee.object) &&
  isFindProperty(statement.expression.callee.property);

interface ExpressionEditorProps
  extends Exclude<ScriptView, ['singleExpression', 'clientScript']> {
  expression: Statement | null;
}

export function ExpressionEditor({
  expression,
  mode,
  scriptableClassFilter,
}: ExpressionEditorProps) {
  const [variableName, setVariableName] = React.useState('');
  const [methods, setMethods] = React.useState<WegasMethod[]>();
  const [parameters, setParameters] = React.useState();
  const [currentMethod, setCurrentMethod] = React.useState<WegasMethod>();
  const variable = useVariableDescriptor(variableName);

  React.useEffect(() => {
    if (variable) {
      getMethodConfig(variable).then(methods => {
        setMethods(
          Object.keys(methods)
            .filter(m =>
              mode === 'SET'
                ? methods[m].returns === undefined
                : methods[m].returns !== undefined,
            )
            .map(k => methods[k]),
        );
      });
    } else {
      setMethods(undefined);
    }
  }, [variable, mode]);

  const variableSchema = {
    view: {
      type: 'variableselect',
      layout: 'inline',
      items: [],
      classFilter: scriptableClassFilter
        ? (scriptableClassFilter.map(sc => sc.substr(2)) as WegasClassNames[])
        : undefined,
    },
  };

  const methodShema = schemaProps.select(
    '',
    false,
    methods ? methods.map(m => m.label) : [],
  );

  /// TESTS
  React.useEffect(() => {
    wlog('New variable name : ' + variableName);
  }, [variableName]);

  React.useEffect(() => {
    wlog('New methods =>');
    wlog(methods);
  }, [methods]);

  return (
    <div className={expressionEditorStyle}>
      <Form
        value={variableName}
        schema={variableSchema}
        onChange={v => setVariableName(v)}
      />
      {methods && (
        <Form
          value={currentMethod}
          schema={methodShema}
          onChange={v => setCurrentMethod(v)}
        />
      )}
      {currentMethod &&
        currentMethod.parameters &&
        currentMethod.parameters.map((p, i) => (
          <Form
            key={i}
            value={parameters[i]}
            schema={
              Object.keys(schemaProps).includes(p.type)
                ? schemaProps[p.type as keyof typeof schemaProps]()
                : schemaProps.string()
            }
            onChange={v => setParameters((p: unknown) => ({ ...p, [i]: v }))}
          />
        ))}
    </div>
  );
}
