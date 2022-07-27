import generate from '@babel/generator';
import { parse } from '@babel/parser';
import {
  CallExpression,
  ExpressionStatement,
  StringLiteral,
} from '@babel/types';
import { css } from '@emotion/css';
import u from 'immer';
import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import { isArray, pick } from 'lodash-es';
import * as React from 'react';
import { deepDifferent } from '../../../../../Components/Hooks/storeHookFactory';
import { Button } from '../../../../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../../../../Components/Theme/ThemeVars';
import { State } from '../../../../../data/Reducer/reducers';
import { GameModel } from '../../../../../data/selectors';
import { useStore } from '../../../../../data/Stores/store';
import { MessageString } from '../../../MessageString';
import { TempScriptEditor } from '../../../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from '../../commonView';
import { Labeled, LabeledView } from '../../labeled';
import { genVarItems } from '../../TreeVariableSelect';
import { returnTypes, scriptEditStyle, ScriptView } from '../Script';
import { generateStatement, parseStatement } from './astManagement';
import {
  generateSchema,
  IConditionAttributes,
  IInitAttributes,
  IParameterAttributes,
  IParameterSchemaAtributes,
  isConditionSchemaAttributes,
  makeItems,
  PartialAttributes,
  SelectOperator,
  testCode,
  typeCleaner,
  WyiswygExpressionSchema,
} from './expressionEditorHelpers';

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

/**
 * Should be done by looking at json files and prevent selection from variables without methods
 */
function selectableFn(item: IVariableDescriptor, _mode?: ScriptMode) {
  return item['@class'] !== 'ListDescriptor';
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
      type: 'UNSET_ERROR';
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
    return genVarItems(variableIdsSelector(s), selectableFn, undefined, value =>
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
          case 'UNSET_ERROR': {
            state.error = undefined;
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

  React.useEffect(() => {
    const parsedCode = testCode(code, mode);
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
  }, [code, mode, variablesItems]);

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
              onChange && onChange(newCode);
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

  const isServerScript = mode === 'SET' || mode === 'GET';

  const onScriptEditorChange = React.useCallback(
    (value: string) => {
      try {
        parse(value).program.body[0];
        dispatchFormState({
          type: 'UNSET_ERROR',
        });
        onChange && onChange(value);
      } catch (e) {
        dispatchFormState({
          type: 'SET_ERROR',
          payload: {
            error: 'Script cannot be parsed',
          },
        });
      }
    },
    [onChange],
  );

  return (
    <div id={id} className={expressionEditorStyle}>
      <Button
        icon="code"
        disabled={typeof error === 'string'}
        pressed={srcMode}
        onClick={() => setSrcMode(srcMode => !srcMode)}
      />
      {typeof error === 'string' || srcMode ? (
        <div className={scriptEditStyle}>
          <MessageString type="error" value={error || softError} />
          <TempScriptEditor
            language={isServerScript ? 'javascript' : 'typescript'}
            initialValue={code}
            onChange={onScriptEditorChange}
            noGutter
            minimap={false}
            returnType={returnTypes(mode)}
            resizable
          />
        </div>
      ) : (
        <Form
          value={attributes}
          schema={schema}
          onChange={(v: IInitAttributes, e) => {
            // TODO: better typings
            //
            // hack: extract "left part" of expression
            // If the left part changed, rebuild a full schema
            const majorProperties = [
              'initExpression',
              'variableName',
              'methodName',
            ];
            // other properties are:
            //  - operator & comparator
            // [number] : arguments
            const prevConfig = pick(attributes, majorProperties);
            const newConfig = pick(v, majorProperties);

            if (deepDifferent(prevConfig, newConfig)) {
              // Config just changed
              // rebuild full schema

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
            } else if (deepDifferent(v, attributes)) {
              // minor change, no need te recompute the schema
              const revivedAttributes = { ...v };
              if (v.initExpression.type === 'variable') {
                revivedAttributes.variableName = v.initExpression.variableName;
              }

              const statement = generateStatement(
                revivedAttributes,
                schema!,
                mode,
              );
              let newCode = undefined;
              if (statement) {
                // Try to parse statement back before sending new code
                const { error } = parseStatement(statement, mode);
                if (!error) {
                  newCode = generate(statement).code;
                  onChange && onChange(newCode);
                }
              }

              dispatchFormState({
                type: 'SET_IF_DEF',
                payload: {
                  attributes: revivedAttributes,
                  softError: e.join('\n'),
                },
              });
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
