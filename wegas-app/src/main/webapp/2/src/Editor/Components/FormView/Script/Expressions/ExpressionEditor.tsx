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
  WyiswygExpressionSchema,
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
  IConditionSchemaAttributes,
  getGlobalMethodConfig,
  generateSchema,
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
import {
  generateConditionStatement,
  generateImpactExpression,
  parseStatement,
  generateMethodStatement,
  generateStatement,
} from './astManagement';
import {
  isWegasMethodReturnType,
  WegasTypeString,
  getVariableMethodConfig,
  WegasMethod,
} from '../../../../editionConfig';
import { safeClientScriptEval } from '../../../../../Components/Hooks/useScript';
import { IconButton } from '../../../../../Components/Inputs/Button/IconButton';
import { MessageString } from '../../../MessageString';
import { WegasScriptEditor } from '../../../ScriptEditors/WegasScriptEditor';
import { CommonView, CommonViewContainer } from '../../commonView';
import { LabeledView, Labeled } from '../../labeled';
import { deepDifferent } from '../../../../../Components/Hooks/storeHookFactory';
import { pick } from 'lodash-es';
import u from 'immer';
import { Layout, Layouts } from 'react-grid-layout';

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
  // schema?: ReturnType<typeof makeVariableMethodSchema>;
  schema?: WyiswygExpressionSchema;
  statement?: Statement;
}
// interface ExpressionEditorState2 {
//   attributes: Partial<IConditionAttributes>;
//   schema?: WyiswygExpressionSchema;
//   statement?: Statement;
//   mode?:ScriptMode;
//   variablesId: number[];
//   error?:string;
// }

// interface StateAction {
//   type: string;
// }

// interface SchemaAction extends StateAction{
//   type: "NEW_SCHEMA";
//   schema: WyiswygExpressionSchema;
// }

// interface StatementAction extends StateAction{
//   type: "NEW_STATEMENT";
//   statement: Statement;
// }

// interface ModeAction extends StateAction{
//   type: "NEW_MODE";
//   mode?: ScriptMode;
// }

// interface VariableIdsAction extends StateAction{
//   type: "NEW_VARAIBLE_IDS";
//   variablesIds?: number[];
// }

// type ExpressionEditorStateActions = StatementAction | ModeAction | VariableIdsAction

// const setState = (
//   state: ExpressionEditorState2,
//   action: ExpressionEditorStateActions,
// ) =>
//   u(state, (state: ExpressionEditorState2) => {
//     const {attributes: oldAttributes, schema: oldSchema, statement: oldStatement, mode : oldMode, variablesId: oldVariableIds, error : oldError} = state;
//     let newState = state;
//     switch(action.type){
//       case "NEW_STATEMENT":{
//           const {attributes, error} = parseStatement(action.statement, oldMode);
//           newState.attributes = attributes;
//           if(error){
//             newState.error = error;
//           }
//           else{
//             newState.schema = await generateSchema(attributes, oldVariableIds, oldMode);
//           }
//           return newState;
//       }
//       case "NEW_MODE":{
//         newState.schema = await generateSchema(oldAttributes, oldVariableIds, action.mode);
//         return newState;
//   }
//     }

//   })

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
  const [formState, setFormState] = React.useState<ExpressionEditorState>({
    statement,
  });

  // Getting variables id
  // First it was done with GameModel.selectCurrent().itemsIds but this array is always full even if the real object are not loaded yet
  // The new way to get itemIds goes directy into the descriptors state and filter to get only the first layer of itemIds
  const variableIds = useStore(
    s =>
      Object.keys(s.variableDescriptors)
        .map(Number)
        .filter(k => !isNaN(k))
        .filter(k => GameModel.selectCurrent().itemsIds.includes(k)),
    deepDifferent,
  );

  React.useEffect(
    () => {
      // if (
      //   !formState.statement ||
      //   generate(formState.statement).code !== generate(statement).code
      // ) {
      try {
        const { attributes, error } = parseStatement(statement, mode);
        if (error !== undefined) {
          setError(error);
        }
        generateSchema(attributes, variableIds, mode).then(schema => {
          // TODO : Validation here

          setFormState({
            attributes,
            schema,
            statement,
          });
        });
      } catch (e) {
        setError(e.message);
      }
      // }
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

  // const finalizeComputation = React.useCallback(
  //   (
  //     value: IInitAttributes | Statement,
  //     attributes: IInitAttributes,
  //     schema: WyiswygExpressionSchema,
  //   ) => {
  //     let statement: Statement | undefined;

  //     // If the statement has just been updated from outside, save it in the state
  //     if (isStatement(value)) {
  //       statement = value;
  //     }
  //     // If the statement has just been generated, send via onChange
  //     else {
  //       statement = generateStatement(attributes, schema, mode);
  //     }

  //     // Always setting the state before sending change because the value returned is compared with the current state
  //     setFormState({
  //       attributes,
  //       schema,
  //       statement,
  //     });
  //     if (!isStatement(value) && statement) {
  //       setError(undefined);
  //       onChange && onChange(statement);
  //       setNewSrc(undefined);
  //     }
  //   },
  //   [onChange],
  // );

  // const computeParameters = React.useCallback(
  //   (
  //     newAttributes: IParameterAttributes,
  //     schemaProperties: IParameterSchemaAtributes,
  //     tolerateTypeVariation: boolean,
  //   ): IParameterAttributes => {
  //     const parameters: IParameterAttributes = {};
  //     Object.keys(schemaProperties).map((k: string) => {
  //       const nK = Number(k);
  //       // // Removing unused parameters
  //       // if (schemaProperties[nK] === undefined) {
  //       //   parameters = omit(parameters, k);
  //       // }
  //       // Do not clean values if they come from an external statement
  //       if (!isNaN(nK)) {
  //         if (
  //           !tolerateTypeVariation &&
  //           typeof newAttributes[nK] !== schemaProperties[nK].type
  //         ) {
  //           setError(`Argument ${k} is not of the good type`);
  //         } else {
  //           // Trying to translate parameter from previous type to new type (undefined if fails)
  //           parameters[nK] = typeCleaner(
  //             newAttributes[nK],
  //             schemaProperties[nK].type as WegasTypeString,
  //             schemaProperties[nK].required,
  //             schemaProperties[nK].value,
  //           );
  //         }
  //       }
  //     });
  //     return parameters;
  //   },
  //   [],
  // );

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

          // Removing operator to atribute if doesn't exists in shema
          if (!('operator' in schemaProperties)) {
            newAttributes = omit(newAttributes, 'operator');
          }

          // Removing comparator to atribute if doesn't exists in shema
          if (
            !('comparator' in schemaProperties) ||
            schemaProperties.comparator === undefined
          ) {
            newAttributes = omit(newAttributes, 'comparator');
          } else {
            //Trying to translate operator
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

      // let variable: IVariableDescriptor | undefined;

      // if (isInitAttributes(attributes)) {
      //   let schema: WyiswygExpressionSchema = {
      //     description: 'unknownSchema',
      //     properties: {},
      //   };

      //   if (attributes.initExpression.type === 'global') {
      //     // Building shema for these methods and selected method (if selected method is undefined then no shema for argument is built)
      //     schema = makeGlobalMethodSchema(
      //       variableIds,
      //       getGlobalMethodConfig(
      //         newAttributes.initExpression.script,
      //       ) as WegasMethod,
      //       mode,
      //     );

      //     // Avoid getting old parameters value if method changes for global methods
      //     const cleanAttributes =
      //       formState.attributes &&
      //       deepDifferent(
      //         formState.attributes.initExpression,
      //         newAttributes.initExpression,
      //       )
      //         ? pick(newAttributes, 'initExpression')
      //         : newAttributes;

      //     // Getting parameters in the current form (removing old attributes like variable method, operator or comparator)
      //     newAttributes = pick(
      //       {
      //         ...cleanAttributes,
      //         ...computeParameters(
      //           cleanAttributes,
      //           schema.properties,
      //           !valueIsStatement,
      //         ),
      //       },
      //       Object.keys(schema.properties),
      //     );
      //     finalizeComputation(
      //       attributes,
      //       newAttributes as IInitAttributes,
      //       schema,
      //     );
      //   } else {
      //     variable = safeClientScriptEval<IVariableDescriptor>(
      //       newAttributes.initExpression.script,
      //     );
      //     if (variable) {
      //       // Getting methods of the descriptor
      //       getVariableMethodConfig(variable).then(res => {
      //         // Getting allowedMethods and checking if current method exists in allowed methods
      //         const allowedMethods = filterMethods(res, mode);
      //         if (
      //           newAttributes.methodName &&
      //           allowedMethods[newAttributes.methodName]
      //         ) {
      //           newAttributes.methodName = newAttributes.methodName;
      //         } else if (valueIsStatement) {
      //           newAttributes.methodName = newAttributes.methodName;
      //           setError('Statement contains unknown method name');
      //         }

      //         // Building shema for these methods and selected method (if selected method is undefined then no shema for argument is built)
      //         schema = makeVariableMethodSchema(
      //           variableIds,
      //           allowedMethods,
      //           newAttributes.methodName
      //             ? allowedMethods[newAttributes.methodName]
      //             : undefined,
      //           mode,
      //         );

      //         // Getting parameters in the current form (removing old attributes like variable method, operator or comparator)
      //         newAttributes = {
      //           ...newAttributes,
      //           ...computeParameters(
      //             newAttributes,
      //             schema.properties,
      //             !valueIsStatement,
      //           ),
      //         };

      //         const conditionSchemaProperties = schema.properties as IConditionSchemaAttributes;

      //         // Removing operator to atribute if doesn't exists in shema
      //         if (!('operator' in conditionSchemaProperties)) {
      //           if (valueIsStatement && 'operator' in newAttributes) {
      //             setError('An impact should not contain an operator');
      //             newAttributes.operator = (newAttributes as IConditionAttributes).operator;
      //           } else {
      //             newAttributes = omit(newAttributes, 'operator');
      //           }
      //         } else {
      //           //Removing operator if not allowed
      //           if (
      //             !conditionSchemaProperties.operator.enum.includes(
      //               (newAttributes as IConditionAttributes).operator,
      //             )
      //           ) {
      //             if (valueIsStatement) {
      //               setError('Operator unknown');
      //               newAttributes.operator = (newAttributes as IConditionAttributes).operator;
      //             } else {
      //               newAttributes.operator = undefined;
      //             }
      //           } else {
      //             newAttributes.operator = (newAttributes as IConditionAttributes).operator;
      //           }
      //         }

      //         // Removing copmparator to atribute if doesn't exists in shema
      //         if (!('comparator' in conditionSchemaProperties)) {
      //           newAttributes = omit(newAttributes, 'comparator');
      //         }
      //         //Do not clean values if they come from an external statement
      //         else if (
      //           valueIsStatement &&
      //           typeof (newAttributes as IConditionAttributes).comparator !==
      //             conditionSchemaProperties.comparator.type
      //         ) {
      //           setError('Comparator type mismatch');
      //         } else {
      //           //Trying to translate operator
      //           newAttributes.comparator = typeCleaner(
      //             (newAttributes as IConditionAttributes).comparator,
      //             conditionSchemaProperties.comparator.type as WegasTypeString,
      //             conditionSchemaProperties.comparator.required,
      //             conditionSchemaProperties.comparator.value,
      //           );
      //         }

      //         finalizeComputation(
      //           attributes,
      //           newAttributes as IInitAttributes,
      //           schema,
      //         );
      //       });
      //     }
      //   }
      // }
      // if (
      //   !newAttributes.initExpression ||
      //   (newAttributes.initExpression.type === 'variable' && !variable)
      // )
      //   setFormState({
      //     attributes: newAttributes,
      //     schema: makeGlobalMethodSchema(variableIds),
      //     statement,
      //   });
    },
    [
      // mode,
      // parseStatement,
      // variableIds,
      // computeParameters,
      // finalizeComputation,
      // formState,
      formState.attributes,
      mode,
      variableIds,
      onChange,
    ],
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

  // React.useEffect(
  //   () => {
  //     if (
  //       !formState.statement ||
  //       generate(formState.statement).code !== generate(statement).code
  //     ) {
  //       console.log('OLD');
  //       console.log(
  //         formState.statement ? generate(formState.statement).code : '',
  //       );
  //       console.log('NEW');
  //       console.log(generate(statement).code);
  //       computeState(statement);
  //     }
  //   },
  //   /* eslint-disable react-hooks/exhaustive-deps */
  //   /* Linter disabled for the following lines to avoid reloading when state change */
  //   [
  //     /*formState,*/
  //     statement,
  //     computeState,
  //   ],
  // );
  // /* eslint-enable */

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
          />
        </div>
      ) : (
        <Form
          value={formState.attributes}
          schema={formState.schema}
          onChange={(v, e) => {
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
