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
import {
  componentMarginLeft,
  flex,
  flexRow,
  itemCenter,
} from '../../../css/classes';
import { createScript } from '../../../Helper/wegasEntites';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { CommonViewContainer } from './commonView';
import { Labeled } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { computeReturnType, ScriptableView } from './ScriptableString';
import { TreeVariableSelect } from './TreeVariableSelect';

const labelStyle = css({
  marginBottom: '5px',
});

const inputModes = ['Variable', 'Code'] as const;
type InputMode = ValueOf<typeof inputModes>;

function parseScript(script: string = ''): InputMode {
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
      if (isCallExpression(initExpression)) {
        const propertyAccess = initExpression.expression;
        if (isPropertyAccessExpression(propertyAccess)) {
          const argumentCallee = propertyAccess.expression;
          const argumentName = propertyAccess.name;
          if (
            isIdentifier(argumentCallee) &&
            argumentCallee.text === 'Variable' &&
            isIdentifier(argumentName) &&
            argumentName.text === 'find'
          ) {
            const [findGameModel, findName] = initExpression.arguments;
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
    } else {
      return 'Code';
    }
  }
  return 'Code';
}

export interface ScriptableBooleanProps
  extends WidgetProps.BaseProps<ScriptableView> {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function ScriptableBoolean(props: ScriptableBooleanProps): JSX.Element {
  const script = props.value ? props.value.content : '';
  const [inputMode, setInputMode] = React.useState<InputMode>(
    parseScript(script),
  );
  let treeValue = '';

  switch (inputMode) {
    case 'Variable': {
      const regexStart = /^(Variable\.find\(gameModel,("|')?)/;
      const regexEnd = /(("|')?\))(;?)$/;
      treeValue = script.replace(regexStart, '').replace(regexEnd, '');
      break;
    }
  }

  const onTreeChange = React.useCallback(
    (value?: string) => {
      const script = `Variable.find(gameModel,'${value}')`;
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
                  returnType={computeReturnType(
                    ['boolean', 'SBooleanDescriptor'],
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
            ) : (
              <span>Unknown input</span>
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
