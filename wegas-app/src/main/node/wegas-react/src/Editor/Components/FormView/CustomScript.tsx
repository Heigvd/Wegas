import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView, Labeled } from './labeled';
import { CommonView, CommonViewContainer } from './commonView';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { toLower } from 'lodash';
import { scriptEditStyle } from './Script/Script';
import { createScript } from '../../../Helper/wegasEntites';
import { IScript } from 'wegas-ts-api';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { computePath } from '../ScriptEditors/SrcEditor';

export interface CustomScriptProps
  extends WidgetProps.BaseProps<
    LabeledView &
      CommonView & {
        language?: CodeLanguage;
        returnType?: string[];
        args?: [string, string[]][];
        scriptContext?: ScriptContext;
      }
  > {
  value?: IScript;
  onChange: (code?: IScript) => void;
}

export function CustomScript({ view, value, onChange }: CustomScriptProps) {
  const onValueChange = React.useCallback(
    (val: string) => {
      onChange(createScript(val, view.language));
    },
    [onChange, view.language],
  );
  const language = view.language
    ? (toLower(view.language) as SrcEditorLanguages)
    : view.language;

  const [filename] = React.useState(computePath(undefined, language));

  return (
    <CommonViewContainer view={view}>
      <Labeled label={view.label} description={view.description} /*{...view}*/>
        {({ labelNode }) => {
          return (
            <>
              {labelNode}
              <div className={scriptEditStyle}>
                <WegasScriptEditor
                  language={language}
                  returnType={view.returnType}
                  args={view.args}
                  models={{ [filename]: value ? value.content : '' }}
                  fileName={filename}
                  onChange={onValueChange}
                  minimap={false}
                  noGutter={true}
                  resizable
                  scriptContext={view.scriptContext}
                />
              </div>
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
