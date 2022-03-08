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
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { TreeVariableSelect } from './TreeVariableSelect';

const labelStyle = css({
  marginBottom: '5px',
});

const inputModes = ['Variable', 'Code'] as const;
type InputMode = ValueOf<typeof inputModes>;

interface Variable {
  type: 'Variable';
  variableName: string;
}

interface Code {
  type: 'Code';
  script: string;
}

type ParsedScript = Variable | Code;

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
              return {
                type: 'Variable',
                variableName: findName.text,
              };
            }
          }
        }
      }
    } else {
      return { type: 'Code', script: script };
    }
  }
  return { type: 'Code', script: '' };
}

export interface ScriptableBooleanProps
  extends WidgetProps.BaseProps<CommonView & LabeledView> {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function ScriptableBoolean(props: ScriptableBooleanProps): JSX.Element {
  const script = props.value ? props.value.content : '';

  const parsedScript = parseScript(script);

  const [inputMode, setInputMode] = React.useState<InputMode>(
    parsedScript.type,
  );
  const treeValue =
    parsedScript.type === 'Variable' ? parsedScript.variableName : '';

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
                  returnType={['boolean', 'SBooleanDescriptor']}
                  language="typescript"
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
