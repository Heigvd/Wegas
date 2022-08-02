import { WidgetProps } from 'jsoninput/typings/types';
import { toLower } from 'lodash';
import * as React from 'react';
import { flex } from '../../css/classes';
import { createScript } from '../../Helper/wegasEntites';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface CodeViewView extends LabeledView, CommonView {
  scriptProps: {
    language?: CodeLanguage;
    returnType?: string[];
    args?: [string, string[]][];
  };
}

export interface CodeViewProps extends WidgetProps.BaseProps<CodeViewView> {
  value?: IScript;
  onChange: (code?: IScript) => void;
}

export default function CodeView(props: CodeViewProps): JSX.Element {
  const { errorMessage, view, onChange, value } = props;
  const { label, description, scriptProps } = view;

  const valueRef = React.useRef(value);
  valueRef.current = value;

  const language = scriptProps.language
    ? (toLower(scriptProps.language) as SrcEditorLanguages)
    : scriptProps.language;

  const onScriptContentChange = React.useCallback(
    (val: string) => {
      onChange(createScript(val, language));
    },
    [onChange, language],
  );

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ labelNode }) => (
          <>
            <div className={flex}>{labelNode}</div>
            <TempScriptEditor
              language={language}
              returnType={scriptProps.returnType}
              args={scriptProps.args}
              initialValue={value ? value.content : ''}
              onChange={onScriptContentChange}
              minimap={false}
              noGutter={true}
              resizable
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
