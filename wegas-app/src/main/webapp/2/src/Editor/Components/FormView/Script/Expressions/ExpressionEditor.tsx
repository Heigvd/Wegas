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
import { pick } from 'lodash-es';
import {
  CallExpression,
  StringLiteral,
  emptyStatement,
  isEmptyStatement,
} from '@babel/types';
import { themeVar } from '../../../../../Components/Theme/ThemeVars';
import { Button } from '../../../../../Components/Inputs/Buttons/Button';
import { EmbeddedSrcEditor } from '../../../ScriptEditors/EmbeddedSrcEditor';
import { State } from '../../../../../data/Reducer/reducers';

const expressionEditorStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
  marginTop: '0.8em',
  padding: '2px',
  div: {
    marginTop: '0',
  },
});

interface ExpressionEditorState {
  attributes?: PartialAttributes;
  schema?: WyiswygExpressionSchema;
  statement?: Statement;
}

function variableIdsSelector(s: State) {
  return Object.keys(s.variableDescriptors)
    .map(Number)
    .filter(k => !isNaN(k))
    .filter(k => GameModel.selectCurrent().itemsIds.includes(k));
}

export interface ExpressionEditorProps extends ScriptView {
  statement: Statement;
  id?: string;
  onChange?: (expression: Statement | Statement[]) => void;
  mode?: ScriptMode;
}

export function ExpressionEditor({
  statement,
  id,
  mode,
  onChange,
}: ExpressionEditorProps) {
  const [error, setError] = React.useState<string>();
  const [srcMode, setSrcMode] = React.useState(false);
  const [newSrc, setNewSrc] = React.useState<string>();
  const [formState, setFormState] = React.useState<ExpressionEditorState>({
    statement,
  });

  // Getting variables id
  // First it was done with GameModel.selectCurrent().itemsIds but this array is always full even if the real object are not loaded yet
  // The new way to get itemIds goes directy into the descriptors state and filter to get only the first layer of itemIds
  const variableIds = useStore(variableIdsSelector);

  React.useEffect(
    () => {
      try {
        const { attributes, error } = parseStatement(
          statement || emptyStatement(),
          mode,
        );

        const isNewOrUnknown =
          !formState.statement ||
          isEmptyStatement(formState.statement) ||
          generate(formState.statement).code !== generate(statement).code;
        if (isNewOrUnknown) {
          if (error !== undefined) {
            setError(error);
          }
          generateSchema(attributes, variableIds, mode).then(schema => {
            // Validating statement with schema
            for (const [key, argument] of Object.entries(attributes)) {
              const numberKey = Number(key);
              const argType = Array.isArray(argument)
                ? 'array'
                : typeof argument;
              if (!isNaN(numberKey)) {
                const schemaArgument = schema.properties[numberKey];
                if (!schemaArgument) {
                  setError('To much arguments');
                } else if (argType !== schemaArgument.type) {
                  setError(
                    `Argument type mismatch.\nExpected type : ${schemaArgument.type}\nArgument type : ${argType}`,
                  );
                }
              }
            }
            setFormState({
              attributes,
              schema,
              statement,
            });
          });
        }
      } catch (e) {
        setError(e.message);
        setFormState({
          statement,
        });
      }
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    /* Linter disabled for the following line to allow reparsing only when a new statement is given to the component
     Another effect should branch on variablesIds and mode and modify only the schema */
    [/* formState.statement, mode, variableIds, */ statement],
    /* eslint-enable */
  );

  React.useEffect(
    () => {
      const attributes = formState.attributes;
      if (attributes)
        generateSchema(attributes, variableIds, mode).then(schema => {
          setFormState(fs => ({
            ...fs,
            schema:
              /* Verifying if fs.attribues changed during the promise work, if changed, don't do anything to avoid incoherent state */
              deepDifferent(attributes, fs.attributes) ? fs.schema : schema,
          }));
        });
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    /* Linter disabled for the following line to avoid refreshing schema after a fromState change. The schema should be refreshed at the same time than the attribute change */
    [mode, variableIds],
    /* eslint-enable */
  );

  const computeState = React.useCallback(
    (attributes: IInitAttributes) => {
      let newAttributes: Partial<IConditionAttributes> =
        formState.attributes &&
        attributes.initExpression.type === 'global' &&
        deepDifferent(
          formState.attributes.initExpression,
          attributes.initExpression,
        )
          ? pick(attributes, 'initExpression')
          : attributes;

      generateSchema(attributes, variableIds, mode).then(
        (schema: WyiswygExpressionSchema) => {
          const schemaProperties = schema.properties;

          //Remove additional properties that doesn't fit schema
          newAttributes = pick(newAttributes, Object.keys(schemaProperties));

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
                // Trying to translate parameter from previous type to new type (undefined if fails)
                return typeCleaner(
                  newAttributes[nK],
                  schemaProperty.type as WegasTypeString,
                  schemaProperty.required,
                  schemaProperty.value,
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
              : undefined;

            //Trying to translate comparator
            newAttributes.comparator = typeCleaner(
              (newAttributes as IConditionAttributes).comparator,
              schemaProperties.comparator.type as WegasTypeString,
              schemaProperties.comparator.required,
              schemaProperties.comparator.value,
            );
          }
          const statement = generateStatement(newAttributes, schema, mode);

          setFormState({
            attributes: newAttributes,
            schema,
            statement,
          });

          if (statement) {
            onChange && onChange(statement);
          }
        },
      );
    },
    [formState.attributes, mode, variableIds, onChange],
  );

  const onScripEditorSave = React.useCallback(
    (value: string) => {
      setNewSrc(undefined);
      try {
        const newStatement = parse(value, {
          sourceType: 'script',
        }).program.body;
        setError(undefined);
        if (newStatement.length === 1) {
          onChange && onChange(newStatement[0]);
        }
      } catch (e) {
        setError(e.message);
      }
    },
    [onChange],
  );

  return (
    <div id={id} className={expressionEditorStyle}>
      {newSrc === undefined && error === undefined && (
        <Button
          icon="code"
          pressed={error !== undefined}
          onClick={() => setSrcMode(sm => !sm)}
        />
      )}
      {error || srcMode ? (
        <div className={scriptEditStyle}>
          <MessageString type="error" value={error} duration={10000} />
          {newSrc !== undefined && (
            <Button icon="check" onClick={() => onScripEditorSave(newSrc)} />
          )}
          <EmbeddedSrcEditor
            value={
              newSrc === undefined
                ? formState.statement
                  ? generate(formState.statement).code
                  : ''
                : newSrc
            }
            onChange={setNewSrc}
            noGutter
            minimap={false}
            returnType={returnTypes(mode)}
            onSave={onScripEditorSave}
            resizable
            scriptContext={mode === 'SET' ? 'Server internal' : 'Client'}
            Editor={WegasScriptEditor}
            EmbeddedEditor={WegasScriptEditor}
          />
        </div>
      ) : (
        <Form
          value={formState.attributes}
          schema={formState.schema}
          onChange={(v, e) => {
            if (deepDifferent(v, formState.attributes)) {
              if (e && e.length > 0) {
                setFormState(fs => ({
                  ...fs,
                  attributes: v,
                  statement: fs.schema
                    ? generateStatement(v, fs.schema, mode)
                    : undefined,
                }));
              } else {
                computeState(v);
              }
            }
          }}
          context={formState.attributes}
        />
      )}
    </div>
  );
}

export interface StatementViewProps extends WidgetProps.BaseProps {
  value: Statement;
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
              statement={props.value}
              {...props.view}
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
