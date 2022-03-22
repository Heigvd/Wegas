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
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonViewContainer } from './commonView';
import { CustomFileSelector } from './FileSelector';
import { Labeled } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { computeReturnType, ScriptableView } from './ScriptableString';
import { TreeVariableSelect } from './TreeVariableSelect';

const labelStyle = css({
  marginBottom: '5px',
});

const inputModes = ['File', 'Variable', 'Code'] as const;
type InputMode = ValueOf<typeof inputModes>;

interface FileLiteral {
  type: 'File';
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

type ParsedScript = FileLiteral | Variable | Code;

function parseScript(script: string = ''): ParsedScript {
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
        return { type: 'File', content: initExpression.text };
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
      return { type: 'File', content: '' };
    }
  }
  return { type: 'Code', script: '' };
}

interface ScriptablePathView extends ScriptableView {
  pickType?: FilePickingType;
  filter?: FileFilter;
}

export interface ScriptablePathProps
  extends WidgetProps.BaseProps<ScriptablePathView> {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function ScriptablePath(props: ScriptablePathProps): JSX.Element {
  const script = props.value ? props.value.content : '';

  const parsedScript = parseScript(script);

  const [inputMode, setInputMode] = React.useState<InputMode>(
    parsedScript.type,
  );
  const textValue = parsedScript.type === 'File' ? parsedScript.content : '';
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
