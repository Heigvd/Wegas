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
} from '@babel/types';
import generate from '@babel/generator';
import {
  ScriptView,
  scriptIsCondition,
  scriptEditStyle,
  returnTypes,
} from './Script';
import {
  getMethodConfig,
  WegasMethod,
  WegasMethodParameter,
} from '../../../editionConfig';
import { useVariableDescriptor } from '../../../../Components/Hooks/useVariable';
import { schemaProps } from '../../../../Components/PageComponents/schemaProps';
import Form from 'jsoninput';
import { css } from 'emotion';
import { WegasScriptEditor } from '../../ScriptEditors/WegasScriptEditor';
import { parse } from '@babel/parser';
import { StyledLabel } from '../../../../Components/AutoImport/String/String';
import { pick, omit } from 'lodash';
import { DEFINED_VIEWS } from '..';
import { IconButton } from '../../../../Components/Inputs/Button/IconButton';
import { deepDifferent } from '../../../../Components/Hooks/storeHookFactory';
import { useComparator } from '../../../../Helper/react.debug';

const expressionEditorStyle = css({
  marginTop: '0.8em',
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
type VariableMethodExpression = Statement &
  CallExpression & {
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

type VariableMethodStatement = Statement & {
  expression: VariableMethodExpression;
};

const isVariableMethodStatement = (
  statement: Expression | Statement,
): statement is VariableMethodStatement =>
  isExpressionStatement(statement) &&
  isCallExpression(statement.expression) &&
  isMemberExpression(statement.expression.callee) &&
  isCallExpression(statement.expression.callee.object) &&
  isMemberExpression(statement.expression.callee.object.callee) &&
  isVariableObject(statement.expression.callee.object.callee.object) &&
  isFindProperty(statement.expression.callee.object.callee.property);
// statement.expression.callee.object.arguments.length === 2;
const getVariable = (expression: VariableMethodExpression) =>
  expression.callee.object.arguments[1].value;
const getMethodName = (expression: VariableMethodExpression) =>
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
        default:
          return generate(a).code;
      }
    }),
  );

const generateParameterSchema = (parameters: WegasMethodParameter[]) =>
  parameters.reduce((o, p, i) => {
    const type = Object.keys(DEFINED_VIEWS).includes(p.type)
      ? p.type
      : 'hidden';
    return {
      ...o,
      [String(i)]: {
        ...p,
        index: i + 2,
        type: p.type === 'number' ? 'number' : 'string',
        formated: p.type !== 'string',
        view: { ...p.view, type, label: 'Argument ' + i, index: i + 2 },
      },
    };
  }, {});

// Condition methods
type ConditionExpressionType = Statement & {
  expression: BinaryExpression & {
    left: CallExpression & VariableMethodExpression;
    right: {
      value: unknown;
    };
    operator: string;
  };
};
const isConditionStatement = (
  statement: Statement,
): statement is ConditionExpressionType =>
  isExpressionStatement(statement) &&
  isBinaryExpression(statement.expression) &&
  isVariableMethodStatement({
    ...statement,
    type: 'ExpressionStatement',
    expression: statement.expression.left,
  }) &&
  isLiteralExpression(statement.expression.right);
const getOperator = (expression: BinaryExpression) => expression.operator;

const booleanOperators = {
  '===': { label: 'equals' },
  '>': { label: 'greater than' },
  '>=': { label: 'greater or equals than' },
  '<': { label: 'lesser than' },
  '<=': { label: 'lesser or equals than' },
};

interface IAttributes {
  [param: string]: unknown;
  variableName?: string;
  methodName?: string;
}
const defaultAttributes: IAttributes = {
  variableName: undefined,
  methodName: undefined,
};
interface IConditionAttributes extends IAttributes {
  operator?: string;
  comparator?: unknown;
}
const defaultConditionAttributes: IConditionAttributes = {
  ...defaultAttributes,
  operator: undefined,
  comparator: undefined,
};

interface ExpressionEditorProps
  extends Exclude<ScriptView, ['singleExpression', 'clientScript']> {
  statement: Statement | null;
  onChange?: (expression: Statement | Statement[]) => void;
}

export function ExpressionEditor({
  statement,
  mode,
  scriptableClassFilter,
  onChange,
}: ExpressionEditorProps) {
  const [currentStatement, setCurrentStatement] = React.useState(statement);
  const [methods, setMethods] = React.useState<{
    [key: string]: WegasMethod;
  }>();
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
  const scriptMethod =
    methods && scriptAttributes && scriptMethodName !== undefined
      ? methods[scriptMethodName]
      : undefined;

  const schema: {
    description: string;
    properties: { [name: string]: ReturnType<ValueOf<typeof schemaProps>> };
  } = {
    description: 'booleanExpressionSchema',
    properties: {
      variableName: schemaProps.variable(
        'variable',
        false,
        scriptIsCondition(mode, scriptableClassFilter)
          ? undefined
          : scriptableClassFilter &&
              scriptableClassFilter.map(sf => sf.substr(2) as WegasClassNames),
        'DEFAULT',
        0,
      ),
      methodName: schemaProps.select(
        'methodName',
        false,
        methods ? Object.keys(methods).map(k => k) : [],
        'string',
        'DEFAULT',
        1,
      ),
      ...(scriptMethod ? generateParameterSchema(scriptMethod.parameters) : {}),
      ...(scriptMethod && scriptIsCondition(mode, scriptableClassFilter)
        ? {
            operator: schemaProps.select(
              'operator',
              false,
              Object.keys(booleanOperators)
                .filter(k => scriptMethod.returns === 'number' || k === '===')
                .map((k: keyof typeof booleanOperators) => ({
                  label: booleanOperators[k].label,
                  value: k,
                })),
              'string',
              'DEFAULT',
              scriptMethod.parameters.length + 2,
            ),
            comparator: schemaProps.custom(
              'comparator',
              false,
              scriptMethod.returns,
              undefined,
              scriptMethod.parameters.length + 3,
            ),
          }
        : {}),
    },
  };

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
        setNewSrc(undefined);
      } catch (e) {
        setError(e.message);
      }
    },
    [onChange],
  );

  const onEditorChange = React.useCallback(
    (scriptAttributes: IAttributes | IConditionAttributes) => {
      let script = `Variable.find(gameModel,${
        scriptAttributes.variableName
          ? `'${scriptAttributes.variableName}'`
          : 'undefined'
      })`;
      if (scriptAttributes.methodName) {
        const parameters = Object.keys(
          omit(schema.properties, Object.keys(defaultConditionAttributes)),
        ).map(k => {
          const param = scriptAttributes[k as keyof typeof scriptAttributes];
          const properties = schema.properties[k] as {
            type?: string;
            formated?: boolean;
          };
          return properties.type === 'string' && !properties.formated
            ? `'${param}'`
            : param;
        });
        script += `.${scriptAttributes.methodName}(${parameters})`;
        if (scriptIsCondition(mode, scriptableClassFilter)) {
          if (scriptAttributes.operator) {
            script += ` ${scriptAttributes.operator} ${
              typeof scriptAttributes.comparator === 'string'
                ? `'${scriptAttributes.comparator}'`
                : scriptAttributes.comparator
            }`;
            onScripEditorSave(script);
          }
        } else {
          onScripEditorSave(script);
        }
      }
    },
    [mode, scriptableClassFilter, onScripEditorSave, schema.properties],
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
        setMethods(
          Object.keys(res)
            .filter(k =>
              mode === 'GET'
                ? res[k].returns !== undefined
                : res[k].returns === undefined,
            )
            .reduce((o, k) => ({ ...o, [k]: res[k] }), {}),
        );
      });
    } else {
      setMethods(undefined);
    }
  }, [variable, mode]);

  useComparator(
    { currentStatement, mode, scriptableClassFilter, methods },
    'SIMPLE',
  );

  React.useEffect(() => {
    if (currentStatement) {
      if (scriptIsCondition(mode, scriptableClassFilter)) {
        debugger;
        if (isConditionStatement(currentStatement)) {
          const newScriptAttributes = {
            variableName: getVariable(currentStatement.expression.left),
            methodName: getMethodName(currentStatement.expression.left),
            ...getParameters(currentStatement.expression.left),
            operator: getOperator(currentStatement.expression),
            comparator: currentStatement.expression.right.value,
          };
          setScriptAttributes(newScriptAttributes);
        } else {
          setError('Cannot be parsed as a condition');
        }
      } else {
        if (isVariableMethodStatement(currentStatement)) {
          const newScriptAttributes = {
            variableName: getVariable(currentStatement.expression),
            methodName: getMethodName(currentStatement.expression),
            ...getParameters(currentStatement.expression),
          };
          setScriptAttributes(newScriptAttributes);
        } else {
          setError('Cannot be parsed as a variable statement');
        }
      }
    }
  }, [currentStatement, mode, scriptableClassFilter]);

  return (
    <div className={expressionEditorStyle}>
      {newSrc !== undefined ? (
        <IconButton icon="save" onClick={() => onScripEditorSave(newSrc)} />
      ) : (
        <IconButton
          icon="code"
          pressed={error !== undefined}
          onClick={() => setSrcMode(sm => !sm)}
        />
      )}
      {error || srcMode ? (
        <div className={scriptEditStyle}>
          <StyledLabel type="error" value={error} duration={3000} />
          <WegasScriptEditor
            value={
              newSrc === undefined
                ? currentStatement
                  ? generate(currentStatement).code
                  : ''
                : newSrc
            }
            onChange={setNewSrc}
            noGutter
            minimap={false}
            returnType={returnTypes(mode, scriptableClassFilter)}
          />
        </div>
      ) : (
        <Form
          value={pick(scriptAttributes, Object.keys(schema.properties))}
          schema={schema}
          onChange={(v, e) => {
            onEditorChange(v);
            setScriptAttributes(v);
            // if (e && e.length > 0) {
            //   setError(e[0].message);
            // }
          }}
        />
      )}
    </div>
  );
}
