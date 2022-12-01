import { cx } from '@emotion/css';
import { ValidationError } from 'jsonschema/lib';
import { editor } from 'monaco-editor';
import * as React from 'react';
import { Value } from '../Components/Outputs/Value';
import { themeVar } from '../Components/Theme/ThemeVars';
import { autoScroll, expandBoth, flex, flexColumn } from '../css/classes';
//It's really important to import index.ts in order to have the widjets allready registered before using Form
import '../Editor/Components/FormView';
import { ExpressionEditor } from '../Editor/Components/FormView/Script/Expressions/ExpressionEditor';
import { MessageString } from '../Editor/Components/MessageString';
import { TempScriptEditor } from '../Editor/Components/ScriptEditors/TempScriptEditor';

export default function ScriptTester() {
  const [value, setValue] = React.useState<string>(
    // '',
    // 'DelayedEvent.delayedFire(1,2,"YOE")',
    // "Variable.find(gameModel,'MyNumber')",
    // "Variable.find(gameModel,'MyNumber').getId() === 1",
    // "Variable.find(gameModel,'MyNumber').add(self,12)",
    // "Event.fired('lkdlsk') === true",
    // "!Event.fired('lkdlsk')",
    // "Variable.find(gameModel, 'MyNumber').getValue(self) === 1",
    `Variable.find(gameModel, 'welcome').setValue(self, {"@class":"TranslatableContent","translations":{"FR":{"@class":"Translation","lang":"FR","status":"","translation":"<p>Salut comment v'asjakdjs?</p>"}},"version":0})`,
  );
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const editorRef = React.useRef<editor.IStandaloneCodeEditor>();

  const setValues = React.useCallback((newValue: string) => {
    setValue(oldValue => {
      if (oldValue !== newValue) {
        if (editorRef.current != null) {
          editorRef.current.setValue(newValue);
        }
        return newValue;
      } else {
        return oldValue;
      }
    });
  }, []);

  return (
    <div className={cx(flex, expandBoth, flexColumn, autoScroll)}>
      {errors.length > 0 && (
        <MessageString
          value={JSON.stringify(errors)}
          duration={10000}
          onLabelVanish={() => setErrors([])}
          type="error"
        />
      )}
      <div style={{ height: '200px' }}>
        <TempScriptEditor
          initialValue={value}
          onChange={setValue}
          language="typescript"
          onEditorReady={editor => (editorRef.current = editor)}
        />
      </div>
      {/* <ExpressionEditor code={value} onChange={setValues} /> */}
      {/* <ExpressionEditor code={value} onChange={setValues} mode="GET" /> */}
      <ExpressionEditor code={value} onChange={setValues} mode="GET_CLIENT" />
      {/* <ExpressionEditor code={value} onChange={setValues} mode="SET" /> */}
      <ExpressionEditor code={value} onChange={setValues} mode="SET_CLIENT" />
      <div
        style={{
          margin: '20px',
          borderStyle: 'solid',
          borderColor: themeVar.colors.PrimaryColor,
        }}
      >
        <Value label={'Value'} value={value} />
      </div>
    </div>
  );
}
