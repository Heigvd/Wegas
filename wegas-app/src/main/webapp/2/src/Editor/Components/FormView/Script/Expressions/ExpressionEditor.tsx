import * as React from 'react';
import {
  Statement,
  isEmptyStatement,
  expressionStatement,
  isStatement,
} from '@babel/types';
import generate from '@babel/generator';
import Form from 'jsoninput';
import { css } from 'emotion';
import { parse } from '@babel/parser';
import { omit } from 'lodash';
import { WidgetProps } from 'jsoninput/typings/types';
import { themeVar } from '../../../../../Components/Theme';
import {
  IConditionAttributes,
  makeVariableMethodSchema,
  IInitAttributes,
  IAttributes,
  IUnknownSchema,
  isConditionAttributes,
  isConditionSchemaAttributes,
  isAttributes,
  IParameterAttributes,
  IParameterSchemaAtributes,
  typeCleaner,
  defaultConditionAttributes,
  defaultAttributes,
  isInitAttributes,
  makeGlobalMethodSchema,
  filterMethods,
  IConditionSchemaAttributes,
} from './expressionEditorHelpers';
import {
  ScriptView,
  ScriptMode,
  isScriptCondition,
  scriptEditStyle,
  returnTypes,
} from '../Script';
import { useStore } from '../../../../../data/store';
import { GameModel } from '../../../../../data/selectors';
import { methodParse, generateMethodStatement } from './astMethodManagement';
import {
  isConditionStatement,
  getVariable,
  getMethodName,
  getParameters,
  getOperator,
  getComparator,
  isImpactStatement,
  generateConditionStatement,
  generateImpactExpression,
} from './astVariableManagement';
import {
  isWegasMethodReturnType,
  WegasTypeString,
  getMethodConfig,
} from '../../../../editionConfig';
import { getGlobalMethodConfig } from './globalMethods';
import { safeClientTSScriptEval } from '../../../../../Components/Hooks/useScript';
import { IconButton } from '../../../../../Components/Inputs/Button/IconButton';
import { MessageString } from '../../../MessageString';
import { WegasScriptEditor } from '../../../ScriptEditors/WegasScriptEditor';
import { CommonView, CommonViewContainer } from '../../commonView';
import { LabeledView, Labeled } from '../../labeled';

const expressionEditorStyle = css({
  backgroundColor: themeVar.primaryHoverColor,
  marginTop: '0.8em',
  padding: '2px',
  div: {
    marginTop: '0',
  },
});

interface ExpressionEditorState {
  attributes?: Partial<IConditionAttributes>;
  schema?: ReturnType<typeof makeVariableMethodSchema>;
  statement?: Statement;
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
  const [error, setError] = React.useState();
  const [srcMode, setSrcMode] = React.useState(false);
  const [newSrc, setNewSrc] = React.useState();
  const [formState, setFormState] = React.useState<ExpressionEditorState>({});
  const variableIds = useStore(() => GameModel.selectCurrent().itemsIds);

  const parseStatement = React.useCallback(
    (
      statement: Statement,
    ): IInitAttributes | IAttributes | IConditionAttributes | undefined => {
      if (!isEmptyStatement(statement)) {
        const newAttributes = methodParse(statement, 'Variable');
        if (newAttributes) {
          return newAttributes;
        } else if (isScriptCondition(mode)) {
          if (isConditionStatement(statement)) {
            return {
              initExpression: {
                type: 'variable',
                script: `Variable.find(gameModel,'${getVariable(
                  statement.expression.left,
                )}')`,
              },
              methodName: getMethodName(statement.expression.left),
              ...getParameters(statement.expression.left),
              operator: getOperator(statement.expression),
              comparator: getComparator(statement.expression),
            };
          } else {
            setError('Cannot be parsed as a condition');
          }
        } else {
          if (isImpactStatement(statement)) {
            return {
              initExpression: {
                type: 'variable',
                script: `Variable.find(gameModel,'${getVariable(
                  statement.expression,
                )}')`,
              },
              methodName: getMethodName(statement.expression),
              ...getParameters(statement.expression),
            };
          } else {
            setError('Cannot be parsed as a variable statement');
          }
        }
      }
    },
    [mode],
  );

  const generateStatement = React.useCallback(
    (attributes: IInitAttributes, properties: IUnknownSchema['properties']) => {
      try {
        let newStatement;
        if (attributes.initExpression) {
          if (attributes.initExpression.type === 'global') {
            newStatement = generateMethodStatement(
              attributes,
              properties,
              true,
            );
          } else {
            if (
              isScriptCondition(mode) &&
              isConditionAttributes(attributes) &&
              isConditionSchemaAttributes(properties)
            ) {
              const comparatorExpectedType = properties.comparator.type;
              const comparatorCurrentType = typeof attributes.comparator;
              newStatement = generateConditionStatement(
                attributes,
                properties,
                comparatorExpectedType
                  ? comparatorExpectedType
                  : isWegasMethodReturnType(comparatorCurrentType)
                  ? comparatorCurrentType
                  : 'string',
                true,
              );
            } else {
              if (isAttributes(attributes)) {
                newStatement = expressionStatement(
                  generateImpactExpression(attributes, properties, true),
                );
              }
            }
          }
        }
        return newStatement;
      } catch (e) {
        return undefined;
      }
    },
    [mode],
  );

  const finalizeComputation = React.useCallback(
    (
      value: IInitAttributes | Statement,
      attributes: IInitAttributes,
      schema: IUnknownSchema,
    ) => {
      let statement: Statement | undefined;

      // If the statement has just been updated from outside, save it in the state
      if (isStatement(value)) {
        statement = value;
      }
      // If the statement has just been generated, send via onChange
      else {
        statement = generateStatement(attributes, schema.properties);
        if (statement) {
          setError(undefined);
          onChange && onChange(statement);
          setNewSrc(undefined);
        }
      }
      setFormState({
        attributes,
        schema,
        statement,
      });
    },
    [generateStatement, onChange],
  );

  const computeParameters = React.useCallback(
    (
      newAttributes: IParameterAttributes,
      schemaProperties: IParameterSchemaAtributes,
      tolerateTypeVariation: boolean,
    ): IParameterAttributes => {
      const parameters: IParameterAttributes = {};
      Object.keys(schemaProperties).map((k: string) => {
        const nK = Number(k);
        // // Removing unused parameters
        // if (schemaProperties[nK] === undefined) {
        //   parameters = omit(parameters, k);
        // }
        // Do not clean values if they come from an external statement
        if (!isNaN(nK)) {
          if (
            !tolerateTypeVariation &&
            typeof newAttributes[nK] !== schemaProperties[nK].type
          ) {
            setError(`Argument ${k} is not of the good type`);
          } else {
            // Trying to translate parameter from previous type to new type (undefined if fails)
            parameters[nK] = typeCleaner(
              newAttributes[nK],
              schemaProperties[nK].type as WegasTypeString,
              schemaProperties[nK].required,
              schemaProperties[nK].value,
            );
          }
        }
      });
      return parameters;
    },
    [],
  );

  const computeState = React.useCallback(
    (value: IInitAttributes | Statement) => {
      let testAttributes: Partial<IConditionAttributes> | undefined;
      let newAttributes: Partial<IConditionAttributes>;
      let statement: Statement | undefined;
      const valueIsStatement = isStatement(value);
      if (isStatement(value)) {
        if (isEmptyStatement(value)) {
          testAttributes = isScriptCondition(mode)
            ? defaultConditionAttributes
            : defaultAttributes;
        } else {
          testAttributes = parseStatement(value);
        }
        if (!testAttributes) {
          setError('Statement cannot be parsed');
          return;
        } else {
          newAttributes = testAttributes;
        }
      } else {
        newAttributes = value;
      }

      let attributes: Partial<IConditionAttributes> = {
        initExpression: newAttributes.initExpression,
        methodName: undefined,
        operator: undefined,
        comparator: undefined,
      };

      let variable: IVariableDescriptor | undefined;

      if (isInitAttributes(attributes)) {
        let schema: IUnknownSchema = {
          description: 'unknownSchema',
          properties: {},
        };

        if (attributes.initExpression.type === 'global') {
          // Building shema for these methods and selected method (if selected method is undefined then no shema for argument is built)
          schema = makeGlobalMethodSchema(
            variableIds,
            getGlobalMethodConfig(
              isScriptCondition(mode),
              attributes.initExpression.script,
            ),
            mode,
          );

          // Avoid getting old parameters value if method changes for global methods
          // detection is made with valueIsStatement because if the value is a statement it means that
          // the attributes were already parsed and it is not a method change.
          const cleanAttributes = !isStatement(value) ? value : newAttributes;

          attributes = {
            ...cleanAttributes,
            ...computeParameters(
              cleanAttributes,
              schema.properties,
              !valueIsStatement,
            ),
          };

          finalizeComputation(value, attributes as IInitAttributes, schema);
        } else {
          variable = safeClientTSScriptEval<IVariableDescriptor>(
            attributes.initExpression.script,
          );
          if (variable) {
            // Getting methods of the descriptor
            getMethodConfig(variable).then(res => {
              // Getting allowedMethods and checking if current method exists in allowed methods
              const allowedMethods = filterMethods(res, mode);
              if (
                newAttributes.methodName &&
                allowedMethods[newAttributes.methodName]
              ) {
                attributes.methodName = newAttributes.methodName;
              } else if (valueIsStatement) {
                attributes.methodName = newAttributes.methodName;
                setError('Statement contains unknown method name');
              }

              // Building shema for these methods and selected method (if selected method is undefined then no shema for argument is built)
              schema = makeVariableMethodSchema(
                variableIds,
                allowedMethods,
                newAttributes.methodName
                  ? allowedMethods[newAttributes.methodName]
                  : undefined,
                mode,
              );

              // Getting parameters in the current form
              attributes = {
                ...attributes,
                ...computeParameters(
                  newAttributes,
                  schema.properties,
                  !valueIsStatement,
                ),
              };

              const conditionSchemaProperties = schema.properties as IConditionSchemaAttributes;

              // Removing operator to atribute if doesn't exists in shema
              if (!('operator' in conditionSchemaProperties)) {
                if (valueIsStatement && 'operator' in newAttributes) {
                  setError('An impact should not contain an operator');
                  attributes.operator = (newAttributes as IConditionAttributes).operator;
                } else {
                  attributes = omit(attributes, 'operator');
                }
              } else {
                //Removing operator if not allowed
                if (
                  !conditionSchemaProperties.operator.enum.includes(
                    (newAttributes as IConditionAttributes).operator,
                  )
                ) {
                  if (valueIsStatement) {
                    setError('Operator unknown');
                    attributes.operator = (newAttributes as IConditionAttributes).operator;
                  } else {
                    attributes.operator = undefined;
                  }
                } else {
                  attributes.operator = (newAttributes as IConditionAttributes).operator;
                }
              }

              // Removing copmparator to atribute if doesn't exists in shema
              if (!('comparator' in conditionSchemaProperties)) {
                attributes = omit(attributes, 'comparator');
              }
              //Do not clean values if they come from an external statement
              else if (
                valueIsStatement &&
                typeof (newAttributes as IConditionAttributes).comparator !==
                  conditionSchemaProperties.comparator.type
              ) {
                setError('Comparator type mismatch');
              } else {
                //Trying to translate operator
                attributes.comparator = typeCleaner(
                  (newAttributes as IConditionAttributes).comparator,
                  conditionSchemaProperties.comparator.type as WegasTypeString,
                  conditionSchemaProperties.comparator.required,
                  conditionSchemaProperties.comparator.value,
                );
              }

              finalizeComputation(value, attributes as IInitAttributes, schema);
            });
          }
        }
      }
      if (
        !attributes.initExpression ||
        (attributes.initExpression.type === 'variable' && !variable)
      )
        setFormState({
          attributes,
          schema: makeGlobalMethodSchema(variableIds),
          statement,
        });
    },
    [mode, parseStatement, variableIds, computeParameters, finalizeComputation],
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
          // computeState(newStatement[0]);
          onChange && onChange(newStatement[0]);
        }
        //onChange && onChange(newStatement);
      } catch (e) {
        setError(e.message);
      }
    },
    [onChange],
  );

  React.useEffect(
    () => {
      if (
        !formState.statement ||
        generate(formState.statement) !== generate(statement)
      ) {
        computeState(statement);
      }
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    /* Linter disabled for the following lines to avoid reloading when state change */
    [
      /*formState,*/
      statement,
      computeState,
    ],
  );
  /* eslint-enable */

  return (
    <div id={id} className={expressionEditorStyle}>
      {newSrc === undefined && error === undefined && (
        <IconButton
          icon="code"
          pressed={error !== undefined}
          onClick={() => setSrcMode(sm => !sm)}
        />
      )}
      {error || srcMode ? (
        <div className={scriptEditStyle}>
          <MessageString type="error" value={error} duration={10000} />
          {newSrc !== undefined && (
            <IconButton icon="save" onClick={() => onScripEditorSave(newSrc)} />
          )}
          <WegasScriptEditor
            value={
              newSrc === undefined
                ? formState.statement && !isEmptyStatement(formState.statement)
                  ? generate(formState.statement).code
                  : ''
                : newSrc
            }
            onChange={setNewSrc}
            noGutter
            minimap={false}
            returnType={returnTypes(mode)}
            onSave={onScripEditorSave}
          />
        </div>
      ) : (
        <Form
          value={formState.attributes}
          schema={formState.schema}
          onChange={(v, e) => {
            if (e && e.length > 0) {
              setFormState(fs => {
                const errorStatement = fs.schema
                  ? generateStatement(v, fs.schema.properties)
                  : undefined;

                return {
                  ...fs,
                  attributes: v,
                  statement: errorStatement,
                };
              });
            } else {
              computeState(v);
            }
          }}
          context={
            formState.attributes
              ? {
                  initExpression: formState.attributes.initExpression,
                }
              : {}
          }
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
