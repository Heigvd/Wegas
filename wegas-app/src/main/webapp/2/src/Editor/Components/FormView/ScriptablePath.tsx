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
import { CustomFileSelector } from './FileSelector';
import { FilePickingType, FileFilter } from '../FileBrowser/FileBrowser';

const labelStyle = css({
  marginBottom: '5px',
});

const inputModes = ['File', 'Variable', 'Code'] as const;
type InputMode = ValueOf<typeof inputModes>;

function parseScript(script: string = ''): InputMode {
  const sourceFile = createSourceFile(
    'Testedfile',
    script,
    ScriptTarget.ESNext,
    true,
  );

  if (isSourceFile(sourceFile)) {
    const initStatement = sourceFile.statements[0];
    if (initStatement != null && isExpressionStatement(initStatement)) {
      const initExpression = initStatement.expression;
      if (initExpression == null || isStringLiteral(initExpression)) {
        return 'File';
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
      return 'File';
    }
  }
  return 'Code';
}

export interface ScriptablePathProps
  extends WidgetProps.BaseProps<
    CommonView &
      LabeledView & { pickType: FilePickingType; filter?: FileFilter }
  > {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function ScriptablePath(props: ScriptablePathProps): JSX.Element {
  const script = props.value ? props.value.content : '';
  const [inputMode, setInputMode] = React.useState<InputMode>(
    parseScript(script),
  );
  let treeValue = '';
  let textValue = '';

  switch (inputMode) {
    case 'Variable': {
      const regexStart = /^(I18n\.toString\(Variable\.find\(gameModel,("|')?)/;
      const regexEnd = /(("|')?\)\))(;?)$/;
      treeValue = script.replace(regexStart, '').replace(regexEnd, '');
      break;
    }
    case 'File': {
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
                <WegasScriptEditor
                  value={script}
                  returnType={['string']}
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
            ) : inputMode === 'File' ? (
              <CustomFileSelector
                value={textValue}
                onChange={value => {
                  const stringified = JSON.stringify(value);
                  props.onChange(
                    props.value
                      ? { ...props.value, content: stringified }
                      : createScript(stringified),
                  );
                }}
                valueType="string"
                pickType={props.view.pickType}
                filter={props.view.filter}
              />
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
