import { css, cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import {
  createSourceFile,
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isPropertyAccessExpression,
  isSourceFile,
  isStringLiteral,
  ScriptTarget,
} from 'typescript';
import { IScript } from 'wegas-ts-api';
import { DropMenu } from '../../../Components/DropMenu';
import HTMLEditor from '../../../Components/HTML/HTMLEditor';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import {
  componentMarginLeft,
  flex,
  flexRow,
  itemCenter,
} from '../../../css/classes';
import { createScript } from '../../../Helper/wegasEntites';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { TreeVariableSelect } from './TreeVariableSelect';

const labelStyle = css({
  marginBottom: '5px',
});

const inputModes = ['Text', 'Variable', 'Code'] as const;
type InputMode = ValueOf<typeof inputModes>;

interface StringLiteral {
  type: 'Text';
  content: string;
}

interface Variable {
  type: 'Variable';
  variableName: string;
}

interface Code {
  type: 'Code';
  script: string;
}

type ParsedScript = StringLiteral | Variable | Code;

function parseScript(script: string = ''): ParsedScript {
  const sourceFile = createSourceFile(
    'Testedfile',
    script,
    ScriptTarget.ESNext,
    /*setParentNodes */ true,
  );

  if (isSourceFile(sourceFile)) {
    const initStatement = sourceFile.statements[0];
    if (initStatement != null && isExpressionStatement(initStatement)) {
      const initExpression = initStatement.expression;
      if (initExpression == null || isStringLiteral(initExpression)) {
        return { type: 'Text', content: initExpression.text };
      } else if (isCallExpression(initExpression)) {
        const propertyAccess = initExpression.expression;
        if (isPropertyAccessExpression(propertyAccess)) {
          const callee = propertyAccess.expression;
          const name = propertyAccess.name;
          if (
            isIdentifier(callee) &&
            callee.text === 'I18n' &&
            isIdentifier(name) &&
            name.text === 'toString'
          ) {
            const toStringArgument = initExpression.arguments[0];
            if (
              toStringArgument != null &&
              isCallExpression(toStringArgument)
            ) {
              const toStringExpression = toStringArgument.expression;
              if (isPropertyAccessExpression(toStringExpression)) {
                const argumentCallee = toStringExpression.expression;
                const argumentName = toStringExpression.name;
                if (
                  isIdentifier(argumentCallee) &&
                  argumentCallee.text === 'Variable' &&
                  isIdentifier(argumentName) &&
                  argumentName.text === 'find'
                ) {
                  const [findGameModel, findName] = toStringArgument.arguments;
                  if (
                    findGameModel != null &&
                    isIdentifier(findGameModel) &&
                    findGameModel.text === 'gameModel' &&
                    findName != null &&
                    isStringLiteral(findName)
                  ) {
                    return {
                      type: 'Variable',
                      variableName: findName.text,
                    };
                  }
                }
              }
            }
          }
        }
      }
    } else if (initStatement != null) {
      return { type: 'Code', script: script };
    } else {
      return { type: 'Text', content: '' };
    }
  }
  return { type: 'Code', script: '' };
}

export interface ScriptableView extends CommonView, LabeledView {
  required: boolean;
}

export function computeReturnType(
  returnType: WegasScriptEditorReturnTypeName[] | undefined,
  required?: boolean,
): WegasScriptEditorReturnTypeName[] | undefined {
  if (returnType == null) {
    return undefined;
  } else if (required) {
    return returnType;
  } else {
    return [...returnType, 'undefined'];
  }
}

interface ScriptableStringView extends ScriptableView {
  richText?: boolean;
}

export interface ScriptableStringProps
  extends WidgetProps.BaseProps<ScriptableStringView> {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function ScriptableString(props: ScriptableStringProps): JSX.Element {
  const script = props.value ? props.value.content : '';
  const parsedScript = parseScript(script);

  const [inputMode, setInputMode] = React.useState<InputMode>(
    parsedScript.type,
  );
  const textValue = parsedScript.type === 'Text' ? parsedScript.content : '';
  const treeValue =
    parsedScript.type === 'Variable' ? parsedScript.variableName : '';

  const onTreeChange = React.useCallback(
    (value?: string) => {
      const script = `I18n.toString(Variable.find(gameModel,'${value}'))`;
      props.onChange(
        props.value
          ? { ...props.value, content: script }
          : createScript(script),
      );
    },
    [props],
  );

  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
        {({ labelNode, inputId }) => (
          <>
            <div className={cx(flex, flexRow, itemCenter, labelStyle)}>
              {labelNode}
              <DropMenu
                label={inputMode}
                items={inputModes.map(mode => ({ label: mode, value: mode }))}
                onSelect={item => {
                  setInputMode(item.value);
                }}
                containerClassName={componentMarginLeft}
              />
            </div>
            {inputMode === 'Code' ? (
              <div className={scriptEditStyle}>
                <WegasScriptEditor
                  value={script}
                  language="typescript"
                  returnType={computeReturnType(
                    ['string'],
                    props.view.required,
                  )}
                  onChange={value =>
                    props.onChange(
                      props.value
                        ? { ...props.value, content: value }
                        : createScript(value),
                    )
                  }
                  minimap={false}
                  noGutter
                  resizable
                />
              </div>
            ) : inputMode === 'Text' ? (
              props.view.richText ? (
                <HTMLEditor
                  value={textValue}
                  onChange={value => {
                    const stringified = JSON.stringify(value);
                    props.onChange(
                      props.value
                        ? { ...props.value, content: stringified }
                        : createScript(stringified),
                    );
                  }}
                />
              ) : (
                <SimpleInput
                  value={textValue}
                  onChange={value => {
                    const stringified = JSON.stringify(value);
                    props.onChange(
                      props.value
                        ? { ...props.value, content: stringified }
                        : createScript(stringified),
                    );
                  }}
                />
              )
            ) : inputMode === 'Variable' ? (
              <TreeVariableSelect
                {...props}
                value={treeValue}
                onChange={onTreeChange}
                inputId={inputId}
                noLabel
              />
            ) : (
              <span>Take a break !</span>
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
