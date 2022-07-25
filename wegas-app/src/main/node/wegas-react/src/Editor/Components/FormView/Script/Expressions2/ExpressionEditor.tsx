import { parse } from '@babel/parser';
import { css } from '@emotion/css';
import u from 'immer';
import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import { isArray, pick } from 'lodash-es';
import { editor } from 'monaco-editor';
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
import { generateCode, LiteralExpressionValue } from './astManagement';
import {
  Attributes,
  generateSchema,
  makeItems,
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
  attributes?: Attributes;
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

function setFormState(state: ExpressionEditorState, action: FormStateActions) {
  return u(state, (state: ExpressionEditorState) => {
    switch (action.type) {
      case 'SET_IF_DEF': {
        const { attributes, error, schema } = action.payload;
        if (attributes != null && deepDifferent(attributes, state.attributes)) {
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
}

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
  const [{ attributes, error, softError, schema }, dispatchFormState] =
    React.useReducer(setFormState, {});

  const editorRef = React.useRef<editor.IStandaloneCodeEditor>();
  React.useEffect(() => {
    if (editorRef.current != null) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  React.useEffect(() => {
    console.log(schema);
  }, [schema]);

  React.useEffect(() => {
    if (error) {
      setSrcMode(true);
    }
  }, [error]);

  const variablesItems = useStore(s => {
    return genVarItems(variableIdsSelector(s), selectableFn, undefined, value =>
      makeItems(value, 'variable'),
    );
  }, deepDifferent);

  React.useEffect(() => {
    const parsedCode = testCode(code, mode);
    if (typeof parsedCode === 'string') {
      dispatchFormState({ type: 'SET_ERROR', payload: { error: parsedCode } });
    } else {
      generateSchema(parsedCode, variablesItems, mode).then(schema => {
        if (
          parsedCode != null &&
          parsedCode.arguments != null &&
          schema.properties.arguments != null
        ) {
          // Validating statement with schema
          for (const index in parsedCode.arguments) {
            const argument = parsedCode.arguments[index];
            const argType = Array.isArray(argument) ? 'array' : typeof argument;
            const schemaArgument = schema.properties.arguments.properties
              ? schema.properties.arguments.properties[index]
              : undefined;
            if (!schemaArgument) {
              dispatchFormState({
                type: 'SET_ERROR',
                payload: { error: 'Too much arguments' },
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

  const onAttributesChange = React.useCallback(
    (newAttributes: NonNullable<Attributes>) => {
      const newCode = generateCode(newAttributes);
      const error = testCode(newCode, mode);
      onChange && onChange(newCode);
      if (typeof error === 'string') {
        return {
          attributes: newAttributes,
          schema,
          code: newCode,
        };
      } else {
        return {
          error,
        };
      }
    },
    [mode, onChange, schema],
  );

  const computeState = React.useCallback(
    (attributes: NonNullable<Attributes>) => {
      return generateSchema(attributes, variablesItems, mode).then(schema => {
        const schemaProperties = schema.properties;
        //Remove additional properties that doesn't fit schema
        let newAttributes = pick(
          attributes,
          Object.keys(schemaProperties),
        ) as NonNullable<Attributes>;

        if (schemaProperties.arguments) {
          const extractedArguments: LiteralExpressionValue[] | undefined =
            Object.values(schemaProperties.arguments.properties ?? []).map(
              (arg, i) => {
                const defaultItemsValue =
                  arg.view != null &&
                  'items' in arg.view &&
                  isArray(arg.view.items) &&
                  arg.view.items.length > 0
                    ? arg.view.items[0]
                    : undefined;

                // Trying to translate parameter from previous type to new type (undefined if fails)
                return typeCleaner(
                  newAttributes?.arguments
                    ? newAttributes?.arguments[i]
                    : undefined,
                  arg.type as WegasTypeString,
                  arg.value || defaultItemsValue,
                ) as LiteralExpressionValue;
              },
            );

          newAttributes = {
            ...newAttributes,
            ...(extractedArguments ? { arguments: extractedArguments } : {}),
          };
        }

        return onAttributesChange(newAttributes);
      });
    },
    [mode, onAttributesChange, variablesItems],
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
            onEditorReady={editor => (editorRef.current = editor)}
          />
        </div>
      ) : (
        <Form
          value={attributes}
          schema={schema}
          onChange={(v: Attributes, e) => {
            // Extract expression object and method
            const majorProperties = [
              'expression',
              'methodId',
              'leftExpression',
            ];
            // other properties can be:
            //  - operator
            //  - comparator
            //  - arguments
            const prevConfig = pick(attributes, majorProperties);
            const newConfig = pick(v, majorProperties);

            if (v == null) {
              dispatchFormState({
                type: 'SET_IF_DEF',
                payload: {
                  attributes: v,
                  softError: e.join('\n'),
                },
              });
            } else if (deepDifferent(prevConfig, newConfig)) {
              // Config just changed
              // rebuild full schema
              let newAttributes: Attributes = v;
              if (v.type === 'condition') {
                newAttributes = {
                  type: 'condition',
                  leftExpression: v.leftExpression,
                };
              } else {
                newAttributes = { type: 'impact', expression: v.expression };
              }

              computeState(newAttributes).then(({ attributes, schema }) =>
                dispatchFormState({
                  type: 'SET_IF_DEF',
                  payload: { attributes, schema, softError: e.join('\n') },
                }),
              );
            } else if (deepDifferent(v, attributes)) {
              // minor change, no need te recompute the schema
              // const revivedAttributes: Attributes = { ...v };
              // if (v.initExpression.type === 'variable') {
              //   revivedAttributes.variableName = v.initExpression.variableName;
              // }
              onAttributesChange(v);
              dispatchFormState({
                type: 'SET_IF_DEF',
                payload: {
                  attributes: v,
                  softError: e.join('\n'),
                },
              });
            }
          }}
          context={attributes}
        />
      )}
      <pre>{JSON.stringify(attributes)}</pre>
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
