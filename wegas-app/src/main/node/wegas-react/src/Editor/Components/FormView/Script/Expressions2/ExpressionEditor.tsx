import { parse } from '@babel/parser';
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
import { generateCode, LiteralExpressionValue } from './astManagement';
import {
  Attributes,
  ConditionAttributes,
  generateSchema,
  GlobalExpressionAttributes,
  ImpactAttributes,
  isExpressionReady,
  LiteralExpressionAttributes,
  makeItems,
  testCode,
  typeCleaner,
  VariableExpressionAttributes,
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
  // code?: string;
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
  debug?: boolean;
}

function debugDebugger(debug: boolean | undefined) {
  if (debug) {
    debugger;
  }
}

const debugLog: (debug: boolean | undefined) => typeof console.log =
  debug =>
  (...arg) => {
    if (debug) {
      console.log(...arg);
    }
  };

export function ExpressionEditor({
  code,
  id,
  mode,
  onChange,
  debug,
}: ExpressionEditorProps) {
  const [srcMode, setSrcMode] = React.useState(false);
  const [{ attributes, error, softError, schema }, dispatchFormState] =
    React.useReducer(setFormState, {});

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

  const codeRef = React.useRef<string>();
  const modeRef = React.useRef<ScriptMode>();
  const variablesItemsRef =
    React.useRef<
      TreeSelectItem<
        | string
        | LiteralExpressionAttributes
        | GlobalExpressionAttributes
        | VariableExpressionAttributes
      >[]
    >();

  React.useEffect(() => {
    if (
      codeRef.current !== code ||
      modeRef.current !== mode ||
      deepDifferent(variablesItemsRef.current, variablesItems)
    ) {
      codeRef.current = code;
      modeRef.current = mode;
      variablesItemsRef.current = variablesItems;

      const parsedCode = testCode(code, mode);
      if (typeof parsedCode === 'string') {
        dispatchFormState({
          type: 'SET_ERROR',
          payload: { error: parsedCode },
        });
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
      schema: WyiswygExpressionSchema | undefined,
    ) => {
      const newCode = generateCode(attributes, schema);
      codeRef.current = newCode;

      debugDebugger(debug);

      if (isExpressionReady(attributes, schema)) {
        onChange && onChange(newCode);
      }

      return {
        attributes,
        schema,
      };
    },
    [debug, onChange],
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

  const isServerScript = mode === 'SET' || mode === 'GET';

  const onScriptEditorChange = React.useCallback(
    (value: string) => {
      try {
        parse(value).program.body[0];
        const newAttributes = testCode(value, mode);
        if (typeof newAttributes === 'string') {
          dispatchFormState({
            type: 'SET_ERROR',
            payload: {
              error: newAttributes,
            },
          });
        } else {
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
            error: 'Script cannot be parsed',
          },
        });
      }
    },
    [mode, onChange],
  );

  React.useEffect(() => {
    debugLog(debug)(schema);
  }, [debug, schema]);

  const onFormChange = React.useCallback(
    (v: Attributes, e: any) => {
      if (v == null) {
        dispatchFormState({
          type: 'SET_IF_DEF',
          payload: {
            attributes: v,
            softError: e.join('\n'),
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
          deepDifferent(currentConfig.leftExpression, newConfig.leftExpression)
        ) {
          computeState(
            pick(newConfig, ['type', 'expression', 'leftExpression']),
          ).then(({ attributes, schema }) =>
            dispatchFormState({
              type: 'SET_IF_DEF',
              payload: { attributes, schema, softError: e.join('\n') },
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
              payload: { attributes, schema, softError: e.join('\n') },
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
              softError: e.join('\n'),
            },
          });
        }
      }
    },
    [attributes, computeState, onAttributesChange, schema],
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
            key={code}
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
          onChange={onFormChange}
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
