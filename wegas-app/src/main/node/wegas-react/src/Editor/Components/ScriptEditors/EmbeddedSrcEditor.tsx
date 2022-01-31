import { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { Modal } from '../../../Components/Modal';
import { MonacoEditor, MonacoSCodeEditor } from './editorHelpers';
import SrcEditor, { computePath } from './SrcEditor';

interface EmbeddedSrcEditorProps {
  value: string;
  language: 'json';
  onChange: (newValue: string) => void;
  onSave: () => void;
}

export function EmbeddedSrcEditor({
  value,
  language,
  onChange,
  onSave,
}: EmbeddedSrcEditorProps) {
  const [editing, setEditing] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState<string>(value || '');
  const cursorOffset = React.useRef(0);
  const embeddedContent = React.useRef('');
  const embeddedCodeInit = React.useRef(0);
  const embeddedCodeEnd = React.useRef(0);

  const embeddedEditorBindings = React.useCallback(
    (monaco: Monaco) => [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Insert],
    [],
  );

  React.useEffect(() => {
    setEditorContent(value || '');
  }, [value]);

  React.useEffect(() => {
    if (onChange && value !== editorContent) {
      onChange(editorContent);
    }
    // No need to listen for onChange or value change here. Only send updates when editorContent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent]);

  const editEmbedded = (monaco: MonacoEditor, editor: MonacoSCodeEditor) => {
    const cursorPosition = editor.getPosition();
    const model = editor.getModel();
    if (cursorPosition && model) {
      const { x, y } = {
        x: cursorPosition.column - 1,
        y: cursorPosition.lineNumber - 1,
      };
      const editorValue = editor.getValue();
      const tokens = monaco.editor.tokenize(editorValue, model.getModeId());
      const tokensLine = tokens[y];
      if (tokensLine != null) {
        const tokenIndex = tokensLine.findIndex(
          (line, i) =>
            line.offset <= x &&
            (tokensLine[i + 1] == null || tokensLine[i + 1].offset > x),
        );
        if (tokenIndex) {
          const codeStart = tokensLine[tokenIndex].offset;
          const codeEnd = tokensLine[tokenIndex + 1]?.offset;
          const tokenContent = model
            .getLineContent(y + 1)
            .substring(codeStart, codeEnd);
          embeddedContent.current = JSON.parse(tokenContent);

          cursorOffset.current = model.getOffsetAt({
            ...cursorPosition,
            column: 0,
          });
          embeddedCodeInit.current = cursorOffset.current + codeStart;
          embeddedCodeEnd.current = cursorOffset.current + codeEnd;

          setEditing(true);
        }
      }
    }
  };
  const onAcceptEmbedded = () => {
    setEditorContent(
      oldContent =>
        oldContent.substring(0, embeddedCodeInit.current) +
        JSON.stringify(embeddedContent.current) +
        oldContent.substring(embeddedCodeEnd.current),
    );
    setEditing(false);
  };

  const [filename] = React.useState(computePath(undefined, 'typescript'));
  const [embeddedFilename] = React.useState(
    computePath(undefined, 'plaintext'),
  );

  return (
    <>
      {editing && (
        <Modal>
          <div
            style={{
              height: '50vh',
              width: '50vw',
            }}
          >
            <SrcEditor
              fileName={embeddedFilename}
              models={{ [embeddedFilename]: embeddedContent.current }}
              onChange={value => {
                embeddedContent.current = value;
              }}
              defaultFocus
              onSave={onAcceptEmbedded}
            />
          </div>
          <Button
            label="Accept"
            onClick={onAcceptEmbedded}
            disableBorders={{ right: true }}
          />
          <Button
            label="Cancel"
            onClick={() => setEditing(false)}
            disableBorders={{ left: true }}
          />
        </Modal>
      )}
      <SrcEditor
        cursorOffset={cursorOffset.current}
        fileName={filename}
        models={{ [filename]: editorContent }}
        onChange={v => setEditorContent(v)}
        onSave={() => onSave()}
        language={language}
        defaultActions={monaco => [
          {
            id: 'embeddedEditor',
            label: 'Open embedded editor',
            keybindings: embeddedEditorBindings(monaco),
            run: editEmbedded,
          },
        ]}
      />
    </>
  );
}
