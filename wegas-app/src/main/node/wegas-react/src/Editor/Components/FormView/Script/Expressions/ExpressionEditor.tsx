import { parse } from '@babel/parser';
import { css } from '@emotion/css';
import u from 'immer';
import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import { debounce, isArray, pick } from 'lodash-es';
import { editor } from 'monaco-editor';
import * as React from 'react';
import { deepDifferent } from '../../../../../Components/Hooks/storeHookFactory';
import { CustomDotLoader } from '../../../../../Components/Loader';
import { themeVar } from '../../../../../Components/Theme/ThemeVars';
import { defaultMarginLeft } from '../../../../../css/classes';
import { State } from '../../../../../data/Reducer/reducers';
import { GameModel } from '../../../../../data/selectors';
import { useStore } from '../../../../../data/Stores/store';
import { wlog } from '../../../../../Helper/wegaslog';
import { MessageString } from '../../../MessageString';
import { TempScriptEditor } from '../../../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from '../../commonView';
import { Labeled, LabeledView } from '../../labeled';
import { genVarItems } from '../../TreeVariableSelect';
import { isServerScript, returnTypes, scriptEditStyle, ScriptView } from '../Script';
import { generateCode, LiteralExpressionValue } from './astManagement';
import {
  Attributes,
  ConditionAttributes,
  generateSchema,
  ImpactAttributes,
  isCodeEqual,
  isExpressionValid,
  LeftExpressionAttributes,
  makeItems,
  parseCode,
  typeCleaner,
  WysiwygExpressionSchema,
} from './expressionEditorHelpers';

type FormOnChange = React.ComponentProps<typeof Form>['onChange'];

const expressionEditorStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
  padding: '2px',
  div: {
    marginTop: '0',
  },
});

interface ExpressionEditorState {
  attributes?: Attributes;
  schema?: WysiwygExpressionSchema;
  error?: string | false;
  softError?: string[];
}

// function variableIdsSelector(s: State) {
//   return Object.keys(s.variableDescriptors)
//     .map(Number)
//     .filter(k => !isNaN(k))
//     .filter(k => GameModel.selectCurrent().itemsIds.includes(k));
// }

function getRootLevelVariableIds(s: State) {
  return s.gameModels[s.global.currentGameModelId].itemsIds;
}

/**
 * Should be done by looking at json files and prevent selection from variables without methods
 */
function selectableFn(item: IVariableDescriptor, _mode?: ScriptMode) {
  return item['@class'] !== 'ListDescriptor';
}

// TODO does't prevent from selecting folders, should it be filtered elsewhere ?
// function selectableFn() {
//   return true;
// }

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
        state.softError = [action.payload.error];
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
  setError?: (errors: string[] | undefined) => void;
}

export function ExpressionEditor({
  code,
  id,
  mode,
  onChange: instantOnChange,
  setError,
}: ExpressionEditorProps) {
  const codeRef = React.useRef<string>();
  const modeRef = React.useRef<ScriptMode>();
  const variablesItemsRef =
    React.useRef<TreeSelectItem<string | LeftExpressionAttributes>[]>();
  const editorRef = React.useRef<editor.IStandaloneCodeEditor>();
  const mountedRef = React.useRef(true);

  const [loading, setLoading] = React.useState(false);
  const [srcMode, setSrcMode] = React.useState(false);
  const [{ attributes, error, softError, schema }, dispatchFormState] =
    React.useReducer(setFormState, {});

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (error) {
      if (setError) {
        setError([error, ...(softError || [])]);
      } else {
        setSrcMode(true);
      }
    }
  }, [error, softError, setError]);

  const variablesItems = useStore(s => {
    //TODO undefined function on 2nd argument does not filter out folders
    return genVarItems(getRootLevelVariableIds(s), selectableFn, undefined, value =>
      makeItems(value, 'variable'),
    );
  }, deepDifferent);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = React.useCallback(
    debounce((code: string) => {
      if (mountedRef.current && instantOnChange) {
        setLoading(false);
        instantOnChange(code);
      }
    }, 1000),
    [instantOnChange],
  );

  const onChange = React.useCallback(
    (code: string) => {
      setLoading(true);
      debouncedOnChange(code);
    },
    [debouncedOnChange],
  );

  React.useEffect(() => {
    if (
      !isCodeEqual(codeRef.current, code) ||
      modeRef.current !== mode ||
      deepDifferent(variablesItemsRef.current, variablesItems)
    ) {
      codeRef.current = code;
      modeRef.current = mode;
      variablesItemsRef.current = variablesItems;

      const parsedCode = parseCode(code, mode);
      if (typeof parsedCode === 'string') {
        dispatchFormState({
          type: 'SET_ERROR',
          payload: { error: parsedCode },
        });
      } else {
        generateSchema(parsedCode, variablesItems, mode).then(schema => {
          if (
            schema.properties.methodId != null &&
            parsedCode?.methodId != null
          ) {
            const method = schema.properties.methodId as
              | { enum: string[] }
              | undefined;
            const choices = method?.enum;
            // If the method is unknown
            if (!choices || !choices.includes(parsedCode.methodId)) {
              dispatchFormState({
                type: 'SET_ERROR',
                payload: {
                  error: `Unknown WYSIWYG method : "${parsedCode.methodId}"`,
                },
              });
              return;
            }
          } else if (
            parsedCode != null &&
            parsedCode.arguments != null &&
            schema.properties.arguments != null
          ) {
            // Validating statement with schema
            for (const index in parsedCode.arguments) {
              const argument = parsedCode.arguments[index];
              const argType = Array.isArray(argument)
                ? 'array'
                : typeof argument;
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
    }
  }, [code, mode, variablesItems]);

  const onAttributesChange = React.useCallback(
    (
      attributes: NonNullable<Attributes>,
      schema: WysiwygExpressionSchema | undefined,
    ) => {
      const newCode = generateCode(attributes, schema);
      codeRef.current = newCode;

      if (isExpressionValid(attributes, schema)) {
        onChange && onChange(newCode);
      }

      return {
        attributes,
        schema,
      };
    },
    [onChange],
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

        return onAttributesChange(newAttributes, schema);
      });
    },
    [mode, onAttributesChange, variablesItems],
  );

  const onScriptEditorChange = React.useCallback(
    (value: string) => {
      if (mountedRef.current == true) {
        try {
          parse(value).program.body[0];
          const newAttributes = parseCode(value, mode);
          if (typeof newAttributes === 'string') {
            dispatchFormState({
              type: 'SET_ERROR',
              payload: {
                error: newAttributes,
              },
            });
          } else {
            wlog('onScriptEditorChange', newAttributes);
            dispatchFormState({
              type: 'SET_IF_DEF',
              payload: { attributes: newAttributes },
            }),
              onChange && onChange(value);
          }

          onChange && onChange(value);
        } catch (e) {
          dispatchFormState({
            type: 'SET_ERROR',
            payload: {
              error: (e as Error).message,
            },
          });
        }
      }
    },
    [mode, onChange],
  );

  const onFormChange: FormOnChange = React.useCallback(
    (v: Attributes, e) => {
      if (mountedRef.current === true) {
        if (v == null) {
          dispatchFormState({
            type: 'SET_IF_DEF',
            payload: {
              attributes: v,
              softError: e.map(error => error.toString()),
            },
          });
        } else {
          const currentConfig = attributes as ImpactAttributes &
            Pick<ConditionAttributes, 'leftExpression'>;
          const newConfig = v as ImpactAttributes &
            Pick<ConditionAttributes, 'leftExpression'>;
          // If type or first expression has changed, keep only type and expression and regenerate schema and send changes
          if (
            currentConfig.type !== newConfig.type ||
            deepDifferent(currentConfig.expression, newConfig.expression) ||
            deepDifferent(
              currentConfig.leftExpression,
              newConfig.leftExpression,
            )
          ) {
            computeState(
              pick(newConfig, ['type', 'expression', 'leftExpression']),
            ).then(({ attributes, schema }) =>
              dispatchFormState({
                type: 'SET_IF_DEF',
                payload: {
                  attributes,
                  schema,
                  softError: e.map(error => error.toString()),
                },
              }),
            );
          }
          // If method has changed, keep only type, expression and method and regenerate schema and send changes
          else if (deepDifferent(currentConfig.methodId, newConfig.methodId)) {
            computeState(
              pick(newConfig, [
                'type',
                'expression',
                'leftExpression',
                'methodId',
              ]),
            ).then(({ attributes, schema }) =>
              dispatchFormState({
                type: 'SET_IF_DEF',
                payload: {
                  attributes,
                  schema,
                  softError: e.map(e => e.toString()),
                },
              }),
            );
          }
          // If arguments, operator or rightExpression has changed, keep current schema and send changes
          else {
            onAttributesChange(newConfig, schema);
            dispatchFormState({
              type: 'SET_IF_DEF',
              payload: {
                attributes: v,
                softError: e.map(e => e.toString()),
              },
            });
          }
        }
      }
    },
    [attributes, computeState, onAttributesChange, schema],
  );

  return (
    <div id={id} className={expressionEditorStyle}>
      {loading ? (
        <div className={defaultMarginLeft}>
          <CustomDotLoader size={21} color={themeVar.colors.PrimaryColor} />
        </div>
      ) : null}
      {typeof error === 'string' || srcMode ? (
        <div className={scriptEditStyle}>
          <MessageString type="error" value={(softError || []).join('\n')} />
          <TempScriptEditor
            language={isServerScript(mode) ? 'javascript' : 'typescript'}
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
          onChange={onFormChange}
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

// TODO adapt that as well
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
