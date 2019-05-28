import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';

export interface EditorProps {
  value?: string;
  uri?: 'internal://page.json';
  readonly?: boolean;
  minimap?: boolean;
  language?: 'javascript' | 'css' | 'json';
  onChange?: (value: string) => void;
  changeDelay?: number;
  onBlur?: (value: string) => void;
  onSave?: (value: string) => void;
}

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

function SrcEditor({
  value,
  uri,
  readonly,
  minimap,
  language,
  onChange,
  changeDelay,
  onBlur,
  onSave,
}: EditorProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [editor, setEditor] = React.useState<
    import('monaco-editor').editor.IStandaloneCodeEditor
  >();
  const oldValue = React.useRef<string>('');
  const delayed = React.useRef<boolean>(false);

  const delay = changeDelay !== undefined ? changeDelay : 50;

  React.useEffect(() => {
    Promise.all([
      import('monaco-editor'),
      import('../../../page-schema.build'),
    ]).then(([monaco, t]) => {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            fileMatch: ['page.json'],
            uri: 'internal://page-schema.json',
            schema: (t as any).schema,
          },
        ],
      });

      if (editor) {
        editor.dispose();
      } else if (container.current) {
        const tempEditor = monaco.editor.create(container.current, {
          theme: 'vs-dark',
        });
        tempEditor.setModel(monaco.editor.createModel(''));
        setEditor(tempEditor);
      }
    });

    return () => {
      if (editor) {
        const model = editor.getModel();
        if (model) {
          model.dispose();
        }
        editor.dispose();
      }
    };
  }, []); //eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (editor && value !== undefined && oldValue.current !== value) {
      oldValue.current = value;
      editor.setValue(oldValue.current);
    }
  }, [value, editor]);

  React.useEffect(() => {
    if (editor) {
      import('monaco-editor').then(monaco => {
        const model = editor.getModel();
        if (model) {
          const oldValue = model.getValue();
          const oldLanguage = model.getModeId();
          model.dispose();
          editor.setModel(
            monaco.editor.createModel(
              oldValue,
              oldLanguage,
              uri ? monaco.Uri.parse(uri) : undefined,
            ),
          );
        }
      });
    }
  }, [editor, uri]);

  React.useEffect(() => {
    if (editor) {
      editor.updateOptions({ readOnly: readonly });
    }
  }, [editor, readonly]);

  React.useEffect(() => {
    if (editor) {
      editor.updateOptions({ minimap: { enabled: minimap } });
    }
  }, [editor, minimap]);

  React.useEffect(() => {
    if (editor && language) {
      import('monaco-editor').then(monaco => {
        const model = editor.getModel();
        if (language && model) {
          monaco.editor.setModelLanguage(model, language);
        }
      });
    }
  }, [editor, language]);

  React.useEffect(() => {
    if (editor && onBlur) {
      const handler = editor.onDidBlurEditorText(() => {
        if (editor) {
          oldValue.current = editor.getValue();
          onBlur(oldValue.current);
        }
      });
      return () => handler.dispose();
    }
  }, [editor, onBlur]);

  React.useEffect(() => {
    if (editor && onChange) {
      const handler = editor.onDidChangeModelContent(e => {
        if (!delayed.current) {
          delayed.current = true;
          setTimeout(() => {
            oldValue.current = editor.getValue();
            onChange(editor.getValue());
            return () => {
              delayed.current = false;
            };
          }, delay);
        }
      });
      return () => handler.dispose();
    }
  }, [editor, onChange, delay]);

  React.useEffect(() => {
    if (editor) {
      import('monaco-editor').then(monaco => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
          if (editor && onSave) {
            onSave(editor.getValue());
          }
        });
      });
    }
  }, [editor, onSave]);

  const layout = React.useCallback(
    (size: { width: number; height: number }) => {
      if (editor) {
        editor.layout(size);
      }
    },
    [editor],
  );

  return (
    <SizedDiv className={overflowHide}>
      {size => {
        if (size !== undefined) {
          layout(size);
        }
        return <div className={overflowHide} ref={container} />;
      }}
    </SizedDiv>
  );
}

export default SrcEditor;

// export default React.memo(SrcEditor, (a, b) => {
//   Object.keys(a).forEach(key => {
//     if (a[key] !== b[key]) {
//       console.log(key, a[key], b[key]);
//     }
//   });
//   return false;
// });
