import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { css } from 'emotion';
import { Modal } from '../../../Components/Modal';
import SrcEditor, {
  MonacoEditor,
  MonacoSCodeEditor,
  MonacoEditorSimpleToken,
} from './SrcEditor';
import {
  StyledLabel,
  LabelStyle,
} from '../../../Components/AutoImport/String/String';
import { WegasScriptEditor } from './WegasScriptEditor';
import { useMonacoEditor } from '../../../Components/Hooks/useMonacoEditor';

const infoDuration = 5000;

const fullHeight = css({
  height: '100%',
});

export interface OnSaveStatus {
  status?: LabelStyle;
  text?: string;
}

interface JSONandJSEditorProps {
  content: string;
  onSave: (content: string) => OnSaveStatus;
}

export function JSONandJSEditor({ content, onSave }: JSONandJSEditorProps) {
  const [editing, setEditing] = React.useState(false);
  const [error, setError] = React.useState<OnSaveStatus>({});
  const [editorContent, setEditorContent] = React.useState(content);
  const cursorOffset = React.useRef(0);
  const jsContent = React.useRef('');
  const jsCodeInit = React.useRef(0);
  const jsCodeEnd = React.useRef(0);
  const monaco = useMonacoEditor();

  React.useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const trySave = (content: string) => {
    setError(onSave(content));
  };

  const editJS = (monaco: MonacoEditor, editor: MonacoSCodeEditor) => {
    try {
      setError({});
      const cursorPosition = editor.getPosition();
      const model = editor.getModel();
      if (cursorPosition && model) {
        const editorValue = editor.getValue();
        let totalOffset = 0;
        const tokens = monaco.editor
          .tokenize(editorValue, 'json')
          .reduce<{ token: MonacoEditorSimpleToken; line: number }[]>(
            (newTokens, tokens, line) => {
              const newT = newTokens.concat(
                tokens.reduce<
                  { token: MonacoEditorSimpleToken; line: number }[]
                >(
                  (nt, t) =>
                    nt.concat({
                      token: {
                        ...t,
                        offset: t.offset + totalOffset,
                      },
                      line: line + 1,
                    }),
                  [],
                ),
              );
              totalOffset =
                totalOffset + model.getLineContent(line + 1).length + 1;
              return newT;
            },
            [],
          );
        //TODO : find a better way to detect script attributes
        // 1. Find the clicked token
        const currentOffset = model.getOffsetAt(cursorPosition);
        const currentTokenIndex = tokens.findIndex(
          (t, i) =>
            t.token.offset < currentOffset &&
            (i + 1 === tokens.length ||
              tokens[i + 1].token.offset > currentOffset),
        );
        if (currentTokenIndex < 0) throw 'No selection';
        // 2. Reverse find the first key "script" token in the 3 previous tokens
        const beforeTokens = tokens
          .slice(
            currentTokenIndex < 3 ? 0 : currentTokenIndex - 3,
            currentTokenIndex + 1,
          )
          .reverse();
        let keyTokenIndex = beforeTokens.findIndex(
          (t, i) =>
            t.token.type === 'string.key.json' &&
            editorValue
              .substring(
                beforeTokens[i - 1]
                  ? beforeTokens[i - 1].token.offset
                  : currentOffset + 1,
                t.token.offset,
              )
              .indexOf('variable') > -1,
        );
        if (keyTokenIndex < 0) throw 'No script key';
        keyTokenIndex = currentTokenIndex - keyTokenIndex;
        //3. Find the first string.value.json token from the key token
        let codeTokenIndex = tokens
          .slice(keyTokenIndex)
          .findIndex(t => t.token.type === 'string.value.json');
        if (codeTokenIndex < 0) throw 'No value for script key';
        codeTokenIndex = keyTokenIndex + codeTokenIndex;
        //4. Slice the editor content to get the script value
        jsCodeInit.current = tokens[codeTokenIndex].token.offset;
        jsCodeEnd.current = tokens[codeTokenIndex + 1]
          ? tokens[codeTokenIndex + 1].token.offset -
            //If lines change between tokens, remove 1 char to avoid (\n)
            Number(
              tokens[codeTokenIndex].line !== tokens[codeTokenIndex + 1].line,
            )
          : editorValue.length;
        jsContent.current = JSON.parse(
          editorValue.substring(jsCodeInit.current, jsCodeEnd.current),
        );
        setEditing(true);
      }
    } catch (e) {
      setError({ status: 'error', text: e });
      // clearTimeout(timeout.current);
      // timeout.current = window.setTimeout(() => setError({}), 10000);
    }
  };
  const onAcceptJS = () => {
    cursorOffset.current = jsCodeInit.current + jsContent.current.length;
    setEditorContent(
      oldContent =>
        oldContent.substring(0, jsCodeInit.current) +
        JSON.stringify(jsContent.current) +
        oldContent.substring(jsCodeEnd.current),
    );
    setEditing(false);
  };

  return (
    <Toolbar className={fullHeight}>
      <Toolbar.Header>
        <button onClick={() => trySave(editorContent)}>Save</button>
        <StyledLabel
          type={error.status}
          value={error.text}
          duration={infoDuration}
        />
      </Toolbar.Header>
      <Toolbar.Content>
        {editing && (
          <Modal>
            <div
              style={{
                height: '50vh',
                width: '50vw',
              }}
            >
              <WegasScriptEditor
                value={jsContent.current}
                onChange={value => {
                  jsContent.current = value;
                }}
                defaultFocus
                onSave={onAcceptJS}
              />
            </div>
            <button onClick={onAcceptJS}>Accept</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </Modal>
        )}
        <SrcEditor
          value={editorContent}
          defaultUri="internal://page.json"
          language="json"
          onChange={val => setEditorContent(val)}
          onSave={trySave}
          cursorOffset={cursorOffset.current}
          defaultFocus={true}
          defaultActions={
            monaco
              ? [
                  {
                    id: 'embeddedJSEditor',
                    label: 'Open embedded JS editor',
                    keybindings: [
                      monaco.KeyMod.Alt | monaco.KeyCode.RightArrow,
                      monaco.KeyMod.chord(
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_J,
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
                      ),
                    ],
                    run: editJS,
                  },
                ]
              : []
          }
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
