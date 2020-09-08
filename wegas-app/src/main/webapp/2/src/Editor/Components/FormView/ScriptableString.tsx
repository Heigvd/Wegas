import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { featuresCTX } from '../../../Components/Contexts/FeaturesProvider';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView, CommonViewContainer } from './commonView';
import { LabeledView, Labeled } from './labeled';
import { TreeVariableSelect } from './TreeVariableSelect';
import { createScript } from '../../../Helper/wegasEntites';
import { cx, css } from 'emotion';
import { flex, flexRow, itemCenter } from '../../../css/classes';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { DropMenu } from '../../../Components/DropMenu';
import HTMLEditor from '../../../Components/HTMLEditor';

export interface ScriptableStringProps
  extends WidgetProps.BaseProps<CommonView & LabeledView> {
  value?: IScript;
  onChange: (IScript: IScript) => void;
}

export function ScriptableString(props: ScriptableStringProps): JSX.Element {
  const script = props.value ? props.value.content : '';
  const [srcMode, setSrcMode] = React.useState(false);
  const [textMode, setTextMode] = React.useState(true);
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
  }, [props.value]);

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
            <div className={cx(flex, flexRow, itemCenter)}>
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
                label={textMode ? 'Text' : 'Variable'}
                items={[
                  { label: 'Text', value: 'Text' },
                  { label: 'Variable', value: 'Variable' },
                ]}
                onSelect={item => {
                  switch (item.value) {
                    case 'Text':
                      setTextMode(true);
                      break;
                    case 'Variable':
                      setTextMode(false);
                      break;
                  }
                }}
                containerClassName={css({ marginLeft: '5px' })}
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
                  // language={'typescript'}
                  minimap={false}
                  noGutter
                  resizable
                />
              </div>
            ) : textMode ? (
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
            ) : (
              <TreeVariableSelect
                {...props}
                value={treeValue}
                onChange={onTreeChange}
                inputId={inputId}
                noLabel
              />
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
