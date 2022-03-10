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

export interface CodeProps
  extends WidgetProps.BaseProps<
    LabeledView & CommonView & { language?: CodeLanguage }
  > {
  value?: IScript | string;
  onChange: (code?: IScript) => void;
}

export function Code({ view, value, onChange }: CodeProps) {
  const language = view.language
    ? (toLower(view.language) as SrcEditorLanguages)
    : view.language;

  const onValueChange = React.useCallback(
    (val: string) => {
      if (value == null || typeof value === 'string') {
        onChange(createScript(val, view.language));
      } else {
        onChange({ ...value, content: val });
      }
    },
    [onChange, view.language, value],
  );
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
                  initialValue={
                    typeof value === 'string' ? value : value?.content || ''
                  }
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
