import * as React from 'react';
import { WegasScriptEditor } from '../../ScriptEditors/WegasScriptEditor';
import Form from 'jsoninput';
import { schemaProps } from '../../../../Components/PageComponents/tools/schemaProps';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView } from '../labeled';
import { CommonView } from '../commonView';
import { Button } from '../../../../Components/Inputs/Buttons/Button';

interface VariableInputProps
  extends WidgetProps.BaseProps<
    LabeledView &
      CommonView & { scriptableClassFilter?: WegasScriptEditorReturnTypeName[] }
  > {
  value?: string;
  onChange: (code: string) => void;
}

const schema = (scriptableClassFilter?: WegasScriptEditorReturnTypeName[]) => ({
  description: 'booleanExpressionSchema',
  properties: {
    variableName: schemaProps.scriptVariable({
      label: 'Variable',
      returnType: scriptableClassFilter,
      // && scriptableClassFilter.map(sf => sf.substr(2) as WegasClassNames),
    }),
  },
});

export function VariableInput(props: VariableInputProps) {
  const [srcMode, setSrcMode] = React.useState(false);
  return (
    <div>
      <Button icon="code" onClick={() => setSrcMode(sm => !sm)} />
      <div>
        {srcMode ? (
          <WegasScriptEditor
            value={props.value}
            onChange={props.onChange}
            noGutter
            minimap={false}
            returnType={props.view.scriptableClassFilter}
          />
        ) : (
          <Form
            value={props.value}
            schema={schema(props.view.scriptableClassFilter)}
            onChange={props.onChange}
          />
        )}
      </div>
    </div>
  );
}
