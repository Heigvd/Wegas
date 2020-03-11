import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView, Labeled } from './labeled';
import { CommonView, CommonViewContainer } from './commonView';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { toLower } from 'lodash';
import { CodeLanguage, scriptEditStyle } from './Script/Script';
import { SrcEditorLanguages } from '../ScriptEditors/SrcEditor';

export interface CodeProps
  extends WidgetProps.BaseProps<
    LabeledView & CommonView & { language?: CodeLanguage }
  > {
  value?: {} | string;
  onChange: (code?: {} | string) => void;
}

export function Code({ view, value, onChange }: CodeProps) {
  const onValueChange = React.useCallback(
    (val: string) => {
      onChange(
        view.language === 'JSON'
          ? val === ''
            ? undefined
            : JSON.parse(val)
          : val,
      );
    },
    [onChange, view.language],
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
                    typeof value === 'string' ? value : JSON.stringify(value)
                  }
                  onBlur={onValueChange}
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
