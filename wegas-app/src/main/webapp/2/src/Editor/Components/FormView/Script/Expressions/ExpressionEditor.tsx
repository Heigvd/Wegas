import * as React from 'react';
import { Statement, ExpressionStatement } from '@babel/types';
import generate from '@babel/generator';
import Form from 'jsoninput';
import { css } from 'emotion';
import { parse } from '@babel/parser';
import { WidgetProps } from 'jsoninput/typings/types';
import {
  IConditionAttributes,
  IInitAttributes,
  WyiswygExpressionSchema,
  isConditionSchemaAttributes,
  IParameterAttributes,
  IParameterSchemaAtributes,
  typeCleaner,
  generateSchema,
  PartialAttributes,
  makeItems,
  IAttributes,
  SelectOperator,
} from './expressionEditorHelpers';
import { ScriptView, scriptEditStyle, returnTypes } from '../Script';
import { useStore } from '../../../../../data/Stores/store';
import { GameModel } from '../../../../../data/selectors';
import { parseStatement, generateStatement } from './astManagement';
import { MessageString } from '../../../MessageString';
import { WegasScriptEditor } from '../../../ScriptEditors/WegasScriptEditor';
import { CommonView, CommonViewContainer } from '../../commonView';
import { LabeledView, Labeled } from '../../labeled';
import { deepDifferent } from '../../../../../Components/Hooks/storeHookFactory';
import { isArray, pick } from 'lodash-es';
import { CallExpression, StringLiteral, emptyStatement } from '@babel/types';
import { themeVar } from '../../../../../Components/Theme/ThemeVars';
import { Button } from '../../../../../Components/Inputs/Buttons/Button';
import { EmbeddedSrcEditor } from '../../../ScriptEditors/EmbeddedSrcEditor';
import { State } from '../../../../../data/Reducer/reducers';
import u from 'immer';
import { genVarItems } from '../../TreeVariableSelect';

const expressionEditorStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
  padding: '2px',
  div: {
    marginTop: '0',
  },
});

interface ExpressionEditorState {
  attributes?: PartialAttributes;
  schema?: WyiswygExpressionSchema;
  error?: string | false;
  softError?: string;
  code?: string;
}

function variableIdsSelector(s: State) {
  return Object.keys(s.variableDescriptors)
    .map(Number)
    .filter(k => !isNaN(k))
    .filter(k => GameModel.selectCurrent().itemsIds.includes(k));
}

type FormStateActions =
  | {
      type: 'SET_IF_DEF';
      payload: ExpressionEditorState;
    }
  | {
      type: 'SET_ERROR';
      payload: { error: string };
    }
  | {
      type: 'SET_SOFT_ERROR';
      payload: { error: string };
    };

export interface ExpressionEditorProps extends ScriptView {
  code: string;
  id?: string;
  onChange?: (code: string) => void;
  mode?: ScriptMode;
}

export function ExpressionEditor({
  code,
  id,
  mode,
  onChange,
}: ExpressionEditorProps) {
  const [srcMode, setSrcMode] = React.useState(false);

  const variablesItems = useStore(s => {
    return genVarItems(variableIdsSelector(s), undefined, undefined, value =>
      makeItems(value, 'variable'),
    );
  }, deepDifferent);

  const setFormState = React.useCallback(
    (state: ExpressionEditorState, action: FormStateActions) => {
      return u(state, (state: ExpressionEditorState) => {
        switch (action.type) {
          case 'SET_IF_DEF': {
            const { attributes, error, schema } = action.payload;
            if (
              attributes != null &&
              deepDifferent(attributes, state.attributes)
            ) {
              state.attributes = attributes;
            }
            if (error != null && deepDifferent(error, state.error)) {
              state.error = error;
            }
            if (schema != null && deepDifferent(schema, state.schema)) {
              state.schema = schema;
            }
            break;
          }
          case 'SET_ERROR': {
            state.error = action.payload.error;
            break;
          }
          case 'SET_SOFT_ERROR': {
            state.softError = action.payload.error;
            break;
          }
        }
      });
    },
    [],
  );

  const [{ attributes, error, softError, schema }, dispatchFormState] =
    React.useReducer(setFormState, {});

  React.useEffect(() => {
    if (error) {
      setSrcMode(true);
    }
  }, [error]);

  const testCode = React.useCallback(
    (
      code: string,
    ):
      | string
      | Partial<IInitAttributes | IAttributes | IConditionAttributes> => {
      let newStatement: Statement = emptyStatement();
      try {
        const statements = parse(code, {
          sourceType: 'script',
        }).program.body;

        if (statements.length <= 1) {
          if (statements.length === 0) {
            newStatement = emptyStatement();
          } else {
            newStatement = statements[0];
          }

          const { attributes, error } = parseStatement(newStatement, mode);

          if (error != null) {
            return error;
          } else {
            return attributes;
          }
        } else {
          return 'While multiple statements are detected, source mode is forced';
        }
      } catch (e) {
        return e.message;
      }
    },
    [mode],
  );

  React.useEffect(() => {
    const parsedCode = testCode(code);
    if (typeof parsedCode === 'string') {
      dispatchFormState({ type: 'SET_ERROR', payload: { error: parsedCode } });
    } else {
      generateSchema(parsedCode, variablesItems, mode).then(schema => {
        // Validating statement with schema
        for (const [key, argument] of Object.entries(parsedCode)) {
          const numberKey = Number(key);
          const argType = Array.isArray(argument) ? 'array' : typeof argument;
          if (!isNaN(numberKey)) {
            const schemaArgument = schema.properties[numberKey];
            if (!schemaArgument) {
              dispatchFormState({
                type: 'SET_ERROR',
                payload: { error: 'To much arguments' },
              });
              return;
            } else if (
              argType !== 'undefined' &&
              argType !== schemaArgument.type
            ) {
              dispatchFormState({
                type: 'SET_ERROR',
                payload: {
                  error: `Argument type mismatch.\nExpected type : ${schemaArgument.type}\nArgument type : ${argType}`,
                },
              });
              return;
            }
          }
        }
        dispatchFormState({
          type: 'SET_IF_DEF',
          payload: { schema, attributes: parsedCode, error: false },
        });
      });
    }
  }, [code, mode, testCode, variablesItems]);

  const computeState = React.useCallback(
    (attributes: IInitAttributes) => {
      return generateSchema(attributes, variablesItems, mode).then(
        (schema: WyiswygExpressionSchema) => {
          const schemaProperties = schema.properties;

          //Remove additional properties that doesn't fit schema
          let newAttributes: Partial<IConditionAttributes> = pick(
            attributes,
            Object.keys(schemaProperties),
          );

          // If a variable is selected, set the variableName
          if (
            newAttributes.initExpression &&
            newAttributes.initExpression.type === 'variable'
          ) {
            const variableName = (
              (
                (
                  parse(newAttributes.initExpression.script).program
                    .body[0] as ExpressionStatement
                ).expression as CallExpression
              ).arguments[1] as StringLiteral
            ).value;
            newAttributes = {
              ...newAttributes,
              variableName,
            };
          }

          newAttributes = {
            ...newAttributes,
            ...(Object.keys(schemaProperties)
              .filter(k => !isNaN(Number(k)))
              .map((k: string) => {
                const nK = Number(k);
                const schemaProperty = schemaProperties[
                  nK
                ] as IParameterSchemaAtributes[number];
                const defaultItemsValue =
                  schemaProperty.view != null &&
                  'items' in schemaProperty.view &&
                  isArray(schemaProperty.view.items) &&
                  schemaProperty.view.items.length > 0
                    ? schemaProperty.view.items[0]
                    : undefined;

                // Trying to translate parameter from previous type to new type (undefined if fails)
                return typeCleaner(
                  newAttributes[nK],
                  schemaProperty.type as WegasTypeString,
                  schemaProperty.value || defaultItemsValue,
                );
              })
              .reduce(
                (o: IParameterAttributes, v, i) => ({ ...o, [i]: v }),
                {},
              ) as IParameterSchemaAtributes),
          };

          if (isConditionSchemaAttributes(schemaProperties)) {
            //Verify the chosen operator and change it if not in the operator list
            newAttributes.operator = schemaProperties.operator.enum.includes(
              newAttributes.operator,
            )
              ? newAttributes.operator
              : (schemaProperties.operator.value as SelectOperator).value;

            //Trying to translate comparator
            newAttributes.comparator = typeCleaner(
              (newAttributes as IConditionAttributes).comparator,
              schemaProperties.comparator.type as WegasTypeString,
              schemaProperties.comparator.value,
            );
          }
          const statement = generateStatement(newAttributes, schema, mode);
          let newCode = undefined;
          if (statement) {
            // Try to parse statement back before sending new code
            const { error } = parseStatement(statement, mode);
            if (!error) {
              newCode = generate(statement).code;
              onChange && onChange(generate(statement).code);
            }
          }

          return {
            attributes: newAttributes,
            schema,
            code: newCode,
          };
        },
      );
    },
    [mode, onChange, variablesItems],
  );

  return (
    <div id={id} className={expressionEditorStyle}>
      <Button
        icon="code"
        disabled={typeof error === 'string'}
        pressed={srcMode}
        onClick={() => setSrcMode(srcMode => !srcMode)}
      />
      {srcMode ? (
        <div className={scriptEditStyle}>
          <MessageString type="error" value={error || softError} />
          <EmbeddedSrcEditor
            value={code}
            onChange={onChange}
            noGutter
            minimap={false}
            returnType={returnTypes(mode)}
            resizable
            scriptContext={mode === 'SET' ? 'Server internal' : 'Client'}
            Editor={WegasScriptEditor}
            EmbeddedEditor={WegasScriptEditor}
          />
        </div>
      ) : (
        <Form
          value={attributes}
          schema={schema}
          onChange={(v: IInitAttributes, e) => {
            if (deepDifferent(v, attributes)) {
              // if (e && e.length > 0) {
              //   dispatchFormState({
              //     type: 'SET_IF_DEF',
              //     payload: { softError: e.join('\n'), attributes: v },
              //   });
              // } else {
              let newAttributes = v;
              if (
                (v.initExpression.type === 'global' &&
                  attributes?.initExpression?.type !== 'global') ||
                v.initExpression.script !== attributes?.initExpression?.script
              ) {
                newAttributes = pick(newAttributes, 'initExpression');
              }
              computeState(newAttributes).then(({ attributes, schema }) =>
                dispatchFormState({
                  type: 'SET_IF_DEF',
                  payload: { attributes, schema, softError: e.join('\n') },
                }),
              );
              // }
            }
          }}
          context={attributes}
        />
      )}
    </div>
  );
}

export interface StatementViewProps extends WidgetProps.BaseProps {
  value: string;
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
              code={props.value}
              {...props.view}
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
