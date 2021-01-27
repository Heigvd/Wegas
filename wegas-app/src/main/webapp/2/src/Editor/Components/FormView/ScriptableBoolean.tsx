import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView, CommonViewContainer } from './commonView';
import { LabeledView, Labeled } from './labeled';
import { TreeVariableSelect } from './TreeVariableSelect';
import { createScript } from '../../../Helper/wegasEntites';
import { cx, css } from 'emotion';
import {
  flex,
  flexRow,
  itemCenter,
  componentMarginLeft,
} from '../../../css/classes';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { DropMenu } from '../../../Components/DropMenu';
import {
  createSourceFile,
  ScriptTarget,
  isSourceFile,
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isStringLiteral,
  isPropertyAccessExpression,
} from 'typescript';

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
  extends WidgetProps.BaseProps<CommonView & LabeledView> {
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
                  returnType={['boolean']}
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
