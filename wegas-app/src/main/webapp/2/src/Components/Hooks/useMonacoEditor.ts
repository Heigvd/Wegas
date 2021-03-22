import { useState, useEffect, useRef } from 'react';
import { monaco, Monaco } from '@monaco-editor/react';

export function useMonacoEditor() {
  const [monacoEditor, setMonacoEditor] = useState<Monaco>();
  const mounted = useRef<boolean>(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  if (!monacoEditor) {
    monaco.init().then(me => {
      if (mounted.current) {
        setMonacoEditor(me);
      }
    });
  }
  return monacoEditor;
}
