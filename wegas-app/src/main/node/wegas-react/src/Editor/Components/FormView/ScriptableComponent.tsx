import { css, cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import { omit } from 'lodash-es';
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
import {
  componentMarginLeft,
  flex,
  flexRow,
  itemCenter,
} from '../../../css/classes';
import { createScript } from '../../../Helper/wegasEntites';
import { TempScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { computeReturnType, ScriptableView } from './ScriptableString';
import { TreeVariableSelect } from './TreeVariableSelect';

const labelStyle = css({
  marginBottom: '5px',
});

interface BaseComponentProps extends WidgetProps.BaseProps<CommonView> {
  value?: string;
  onChange: (value?: string) => void;
}

export interface ScriptableComponentProps
  extends WidgetProps.BaseProps<ScriptableView> {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function scriptableComponentFactory<BCT extends BaseComponentProps>(
  BaseComponent: React.FunctionComponent<BCT>,
  componentLabel: string,
) {
  const inputModes = [componentLabel, 'Variable', 'Code'] as const;

  function parseScript(script: string = ''): string {
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
          return componentLabel;
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
                    const [findGameModel, findName] =
                      toStringArgument.arguments;
                    if (
                      findGameModel != null &&
                      isIdentifier(findGameModel) &&
                      findGameModel.text === 'gameModel' &&
                      findName != null &&
                      isStringLiteral(findName)
                    ) {
                      return 'Variable';
                    }
                  }
                }
              }
            }
          }
        }
      } else if (initStatement != null) {
        return 'Code';
      } else {
        return componentLabel;
      }
    }
    return 'Code';
  }

  return function ScriptableComponent<
    SCT extends ScriptableComponentProps & Omit<BCT, 'value' | 'onChange'>,
  >(props: SCT): JSX.Element {
    const script = props.value ? props.value.content : '';
    const [inputMode, setInputMode] = React.useState<string>(
      parseScript(script),
    );
    let treeValue = '';
    let textValue = '';

    switch (inputMode) {
      case 'Variable': {
        const regexStart =
          /^(I18n\.toString\(Variable\.find\(gameModel,("|')?)/;
        const regexEnd = /(("|')?\)\))(;?)$/;
        treeValue = script.replace(regexStart, '').replace(regexEnd, '');
        break;
      }
      case componentLabel: {
        try {
          textValue = JSON.parse(script);
        } catch (e) {
          textValue = script;
        }
        break;
      }
    }

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
                  <TempScriptEditor
                    initialValue={script}
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
              ) : inputMode === 'Variable' ? (
                <TreeVariableSelect
                  {...props}
                  value={treeValue}
                  onChange={onTreeChange}
                  inputId={inputId}
                  noLabel
                />
              ) : inputMode === componentLabel ? (
                <BaseComponent
                  {...(omit(props, ['value', 'onChange']) as unknown as BCT)}
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
                <span>The selected mode is not available</span>
              )}
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  };
}
