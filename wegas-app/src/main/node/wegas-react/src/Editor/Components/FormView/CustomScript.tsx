import { WidgetProps } from 'jsoninput/typings/types';
import { toLower } from 'lodash';
import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { createScript } from '../../../Helper/wegasEntites';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { scriptEditStyle } from './Script/Script';

export interface CustomScriptProps
  extends WidgetProps.BaseProps<
    LabeledView &
      CommonView & {
        language?: CodeLanguage;
        returnType?: string[];
        args?: [string, string[]][];
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

  return (
    <CommonViewContainer view={view}>
      <Labeled label={view.label} description={view.description} /*{...view}*/>
        {({ labelNode }) => {
          return (
            <>
              {labelNode}
              <div className={scriptEditStyle}>
                <TempScriptEditor
                  language={language}
                  returnType={view.returnType}
                  args={view.args}
                  initialValue={value ? value.content : ''}
                  onChange={onValueChange}
                  minimap={false}
                  noGutter={true}
                  resizable
                />
              </div>
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}
