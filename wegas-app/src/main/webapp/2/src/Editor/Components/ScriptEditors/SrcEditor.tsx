import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import { Uri } from 'monaco-editor';

export interface EditorProps {
  value?: string;
  uri?: 'internal://page.json';
  readonly?: boolean;
  minimap?: boolean;
  language?: 'javascript' | 'css' | 'json';
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  onSave?: (value: string) => void;
  saveWithKey?: boolean;
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
  onBlur,
  onSave,
  saveWithKey,
}: EditorProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const editor = React.useRef<
    import('monaco-editor').editor.IStandaloneCodeEditor
  >();
  const model = React.useRef<import('monaco-editor').editor.ITextModel>();
  // const [readyState, setReadyState] = React.useState(false);
  const [monaco, setMonaco] = React.useState<typeof import('monaco-editor')>();

  React.useEffect(() => {
    import('monaco-editor').then(monaco => {
      import('../../../page-schema.build').then(t =>
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [
            {
              fileMatch: ['page.json'],
              uri: 'internal://page-schema.json',
              schema: (t as any).schema,
            },
          ],
        }),
      );

      if (editor.current) {
        editor.current.dispose();
      } else if (container.current) {
        editor.current = monaco.editor.create(container.current, {
          theme: 'vs-dark',
        });

        if (saveWithKey && onSave) {
          editor.current.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
            onSave,
          );
        }

        setMonaco(monaco);
      }
    });

    return () => {
      if (editor.current) {
        editor.current.dispose();
      }
      if (model.current) {
        model.current.dispose();
      }
    };
  }, []);

  React.useEffect(() => {
    if (editor.current && value) {
      editor.current.setValue(value);
    }
  }, [value, monaco]);

  React.useEffect(() => {
    if (monaco && editor.current) {
      let oldValue = value;
      let oldLanguage: string | undefined = language;
      if (model.current) {
        oldValue = model.current.getValue();
        oldLanguage = model.current.getModeId();
      }
      if (model.current) {
        model.current.dispose();
      }

      model.current = monaco.editor.createModel(
        oldValue ? oldValue : '',
        oldLanguage,
        uri ? monaco.Uri.parse(uri) : undefined,
      );
      editor.current.setModel(model.current);
    }
  }, [monaco, uri]);

  React.useEffect(() => {
    if (monaco && editor.current) {
      editor.current.updateOptions({ readOnly: readonly });
    }
  }, [monaco, readonly]);

  React.useEffect(() => {
    if (monaco && editor.current) {
      editor.current.updateOptions({ minimap: { enabled: minimap } });
    }
  }, [monaco, minimap]);

  React.useEffect(() => {
    if (monaco && model.current && language) {
      monaco.editor.setModelLanguage(model.current, language);
    }
  }, [monaco, language]);

  React.useEffect(() => {
    if (editor.current && onBlur) {
      editor.current.onDidBlurEditorText(() => {
        if (editor.current) {
          onBlur(editor.current.getValue());
        }
      });
    }
  }, [monaco, onBlur]);

  React.useEffect(() => {
    if (editor.current && onChange) {
      editor.current.onDidChangeModelContent(() => {
        if (editor.current) {
          onChange(editor.current.getValue());
        }
      });
    }
  }, [monaco, onChange]);

  React.useEffect(() => {
    if (editor.current && onSave && monaco) {
      editor.current.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
        () => {
          if (editor.current) {
            onSave(editor.current.getValue());
          }
        },
      );
    }
  }, [monaco, onSave]);

  const layout = (size: { width: number; height: number }) => {
    if (editor.current) {
      editor.current.layout(size);
    }
  };

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
