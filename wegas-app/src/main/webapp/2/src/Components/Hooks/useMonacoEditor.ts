import { useState } from 'react';
import { monaco, Monaco } from '@monaco-editor/react';

export function useMonacoEditor() {
  const [monacoEditor, setMonacoEditor] = useState<Monaco>();
  if (!monacoEditor) {
    monaco.init().then(setMonacoEditor);
  }
  return monacoEditor;
}
