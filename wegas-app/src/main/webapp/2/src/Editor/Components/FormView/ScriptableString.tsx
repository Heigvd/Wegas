import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { featuresCTX } from '../../../Components/Contexts/FeaturesProvider';
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
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { DropMenu } from '../../../Components/DropMenu';
import HTMLEditor from '../../../Components/HTMLEditor';

const labelStyle = css({
  marginBottom: '5px',
});

const inputModes = ['Text', 'Variable', 'New Variable'] as const;
type InputMode = ValueOf<typeof inputModes>;

export interface ScriptableStringProps
  extends WidgetProps.BaseProps<CommonView & LabeledView> {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function ScriptableString(props: ScriptableStringProps): JSX.Element {
  const script = props.value ? props.value.content : '';
  const [srcMode, setSrcMode] = React.useState(false);
  const [inputMode, setInputMode] = React.useState<InputMode>('Text');
  const [treeValue, setTreeValue] = React.useState('');

  const { currentFeatures } = React.useContext(featuresCTX);

  let textContent: string | undefined;
  try {
    textContent = JSON.parse(props?.value?.content || '""');
  } catch (_e) {
    textContent = props?.value?.content;
  }

  /**
   * Effect that forces srcMode in case the script is too complex to be parsed
   */
  React.useEffect(() => {
    try {
      JSON.parse(script);
      setInputMode('Text');
    } catch (e) {
      setInputMode('Variable');
    }
    if (!props.value || !props.value.content) {
      setTreeValue('');
    } else {
      const regexStart = /^(I18n\.toString\(Variable\.find\(gameModel,("|')?)/;
      const regexEnd = /(("|')?\)\))(;?)$/;
      const simpleVarFindRegex = new RegExp(
        regexStart.source + `.*` + regexEnd.source,
      );
      if (props.value.content.match(simpleVarFindRegex)) {
        setTreeValue(
          props.value.content.replace(regexStart, '').replace(regexEnd, ''),
        );
      }
    }
  }, [props.value, script]);

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
              {currentFeatures.includes('ADVANCED') && (
                <Button
                  icon={
                    srcMode
                      ? ['circle', { icon: 'code', color: 'white', size: 'xs' }]
                      : 'code'
                  }
                  onClick={() => setSrcMode(sm => !sm)}
                />
              )}
              <DropMenu
                label={inputMode}
                items={inputModes.map(mode => ({ label: mode, value: mode }))}
                onSelect={item => {
                  setInputMode(item.value);
                }}
                containerClassName={componentMarginLeft}
              />
            </div>
            {srcMode ? (
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
            ) : inputMode === 'Text' ? (
              <HTMLEditor
                value={textContent}
                onChange={value => {
                  const stringified = JSON.stringify(value);
                  props.onChange(
                    props.value
                      ? { ...props.value, content: stringified }
                      : createScript(stringified),
                  );
                }}
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
