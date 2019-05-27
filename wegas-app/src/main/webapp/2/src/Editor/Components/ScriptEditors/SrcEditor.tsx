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
  onBlur,
  onSave,
}: EditorProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [editor, setEditor] = React.useState<
    import('monaco-editor').editor.IStandaloneCodeEditor
  >();

  React.useEffect(() => () => editor && editor.dispose(), []);

  React.useEffect(() => {
    import('monaco-editor').then(monaco => {
      if (container.current) {
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
        const model = monaco.editor.createModel(
          value || '',
          language,
          uri ? monaco.Uri.parse(uri) : undefined,
        );
        const tempEditor = monaco.editor.create(container.current, {
          theme: 'vs-dark',
          model: model,
          minimap: { enabled: minimap },
          readOnly: readonly,
        });
        setEditor(tempEditor);
      }
    });
  }, [editor, language, uri, readonly, value, minimap]);

  React.useEffect(() => {
    if (editor && value) {
      editor.setValue(value);
    }
  }, [value, editor]);

  React.useEffect(() => {
    if (editor && onBlur) {
      editor.onDidBlurEditorText(() => {
        onBlur(editor.getValue());
      });
    }
  }, [onBlur, editor]);

  React.useEffect(() => {
    if (editor && onChange) {
      editor.onDidBlurEditorText(() => {
        onChange(editor.getValue());
      });
    }
  }, [onChange, editor]);

  React.useEffect(() => {
    if (editor && onSave) {
      import('monaco-editor').then(monaco => {
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
          function() {
            onSave(editor.getValue());
          },
        );
      });
    }
  }, [onSave, editor]);

  const layout = (size: { width: number; height: number }) => {
    if (editor != null) {
      editor.layout(size);
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
