import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { Button } from '../../../../Components/Inputs/Buttons/Button';
import { schemaProps } from '../../../../Components/PageComponents/tools/schemaProps';
import { WegasScriptEditor } from '../../ScriptEditors/WegasScriptEditor';
import { CommonView } from '../commonView';
import { LabeledView } from '../labeled';

interface VariableInputProps
  extends WidgetProps.BaseProps<
    LabeledView &
      CommonView & { scriptableClassFilter?: WegasScriptEditorReturnTypeName[] }
  > {
  value?: string;
  onChange: (code: string) => void;
}

const makeSchema = (
  scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
) => ({
  description: 'booleanExpressionSchema',
  properties: {
    variableName: schemaProps.scriptVariable({
      label: 'Variable',
      returnType: scriptableClassFilter,
      // && scriptableClassFilter.map(sf => sf.substr(2) as WegasClassNames),
    }),
  },
});

export function VariableInput({ onChange, view, value }: VariableInputProps) {
  const [srcMode, setSrcMode] = React.useState(false);
  return (
    <div>
      <Button icon="code" onClick={() => setSrcMode(sm => !sm)} />
      <div>
        {srcMode ? (
          <WegasScriptEditor
            value={value || ''}
            language="typescript"
            onChange={onChange}
            noGutter
            minimap={false}
            returnType={view.scriptableClassFilter}
          />
        ) : (
          <Form
            value={value}
            schema={makeSchema(view.scriptableClassFilter)}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}
