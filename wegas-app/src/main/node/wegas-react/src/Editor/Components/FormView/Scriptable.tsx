import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';
import Form from 'jsoninput';
import { entityIs } from '../../../data/entities';
import { toLower } from 'lodash';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { clientScriptEval } from '../../../Components/Hooks/useScript';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { computePath } from '../ScriptEditors/SrcEditor';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { flex } from '../../../css/classes';
import { createScript } from '../../../Helper/wegasEntites';
import { AvailableSchemas } from '.';

export interface ScriptableViewProps
  extends WidgetProps.BaseProps<
    LabeledView &
      CommonView & {
        scriptProps: {
          language?: CodeLanguage;
          returnType?: string[];
          args?: [string, string[]][];
          scriptContext?: ScriptContext;
        };
        literalSchema: AvailableSchemas;
      }
  > {
  value?: IScript | {};
  onChange: (code?: IScript | unknown) => void;
}

export default function ScriptableView(
  props: ScriptableViewProps,
): JSX.Element {
  const { errorMessage, view, onChange, value } = props;

  const { label, description, literalSchema, scriptProps } = view;

  //const [srcMode, setSrcMode] = React.useState(false);

  const valueRef = React.useRef(value);
  valueRef.current = value;

  const language = scriptProps.language
    ? (toLower(scriptProps.language) as SrcEditorLanguages)
    : scriptProps.language;

  /**
   * Convert current value to IScript
   */
  const switchToScriptMode = React.useCallback(() => {
    let scripted;
    try {
      scripted = JSON.stringify(valueRef.current);
    } catch {
      scripted = valueRef.current;
    }
    onChange({
      '@class': 'Script',
      language: language,
      content: scripted || '',
    } as IScript);
  }, [onChange, language]);

  /**
   * Convert current value to IScript
   */
  const switchToLiteralMode = React.useCallback(() => {
    if (entityIs(valueRef.current, 'Script')) {
      const evaluated = clientScriptEval(valueRef.current);
      if (evaluated != null) {
        onChange(evaluated);
      } else {
        onChange(undefined);
      }
    }
  }, [onChange]);

  const [filename] = React.useState(computePath(undefined, language));

  const onScriptContentChange = React.useCallback(
    (val: string) => {
      onChange(createScript(val, language));
    },
    [onChange, language],
  );

  const isScript = entityIs(value, 'Script');
  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ labelNode }) => (
          <>
            <div className={flex}>
              {labelNode}
              <Button
                icon="code"
                onClick={isScript ? switchToLiteralMode : switchToScriptMode}
              />
            </div>
            {entityIs(value, 'Script') ? (
              <WegasScriptEditor
                language={language}
                returnType={scriptProps.returnType}
                args={scriptProps.args}
                models={{ [filename]: value ? value.content : '' }}
                fileName={filename}
                onChange={onScriptContentChange}
                minimap={false}
                noGutter={true}
                resizable
                scriptContext={scriptProps.scriptContext}
              />
            ) : (
              <Form
                schema={literalSchema}
                value={value}
                onChange={onChange}
              />
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
