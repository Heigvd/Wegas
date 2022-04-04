import { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { useTempModel } from '../../../Components/Contexts/LibrariesContext';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { Modal } from '../../../Components/Modal';
import {
  MonacoEditor,
  MonacoSCodeEditor,
  SrcEditorLanguages,
} from './editorHelpers';
import SrcEditor from './SrcEditor';

interface EmbeddedEditorProps {
  initialValue: string;
  language: SrcEditorLanguages;
  onChange: (newValue: string) => void;
  onSave: () => void;
}

export function EmbeddedEditor({
  initialValue,
  language,
  onChange,
  onSave,
}: EmbeddedEditorProps) {
  const [editing, setEditing] = React.useState(false);
  const cursorOffset = React.useRef(0);
  const embeddedCodeInit = React.useRef(0);
  const embeddedCodeEnd = React.useRef(0);

  const valueModel = useTempModel(initialValue, language);
  valueModel?.onDidChangeContent(() => {
    onChange(valueModel.getValue());
  });
  const embeddedModel = useTempModel('', 'plaintext');

  const embeddedEditorBindings = React.useCallback(
    (monaco: Monaco) => [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Insert],
    [],
  );

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
          embeddedModel?.setValue(JSON.parse(tokenContent));

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
    valueModel?.setValue(
      valueModel.getValue().substring(0, embeddedCodeInit.current) +
        JSON.stringify(embeddedModel?.getValue()) +
        valueModel.getValue().substring(embeddedCodeEnd.current),
    );
    setEditing(false);
  };

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
              fileName={embeddedModel?.uri.toString()}
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
        fileName={valueModel?.uri.toString()}
        onSave={() => onSave()}
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
