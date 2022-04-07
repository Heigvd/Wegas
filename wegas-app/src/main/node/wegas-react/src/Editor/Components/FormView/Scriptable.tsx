import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import { toLower } from 'lodash';
import * as React from 'react';
import { AvailableSchemas } from '.';
import { clientScriptEval } from '../../../Components/Hooks/useScript';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { flex } from '../../../css/classes';
import { entityIs } from '../../../data/entities';
import { createScript } from '../../../Helper/wegasEntites';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface ScriptableViewProps
  extends WidgetProps.BaseProps<
    LabeledView &
      CommonView & {
        scriptProps: {
          language?: CodeLanguage;
          returnType?: string[];
          args?: [string, string[]][];
        };
        literalSchema: AvailableSchemas;
      }
  > {
  value?: IScript | string;
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
      const evaluated = clientScriptEval(
        valueRef.current,
        undefined,
        undefined,
        undefined,
      );
      if (evaluated != null) {
        onChange(evaluated);
      } else {
        onChange(undefined);
      }
    }
  }, [onChange]);

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
            ) : (
              <Form schema={literalSchema} value={value} onChange={onChange} />
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
