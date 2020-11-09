import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView, Labeled } from './labeled';
import { CommonView, CommonViewContainer } from './commonView';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { toLower } from 'lodash';
import { CodeLanguage, scriptEditStyle } from './Script/Script';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { IScript } from 'wegas-ts-api';
import { createScript } from '../../../Helper/wegasEntites';

export interface CodeProps
  extends WidgetProps.BaseProps<
    LabeledView & CommonView & { language?: CodeLanguage }
  > {
  value?: IScript | string;
  onChange: (code?: IScript) => void;
}

export function Code({ view, value, onChange }: CodeProps) {
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
                <WegasScriptEditor
                  language={
                    view.language
                      ? (toLower(view.language) as SrcEditorLanguages)
                      : view.language
                  }
                  value={
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
