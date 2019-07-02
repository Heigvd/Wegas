import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { css } from 'emotion';
import { Modal } from '../../../Components/Modal';
import SrcEditor from './SrcEditor';
import { KeyMod, KeyCode } from 'monaco-editor';
import { StyledLabel } from '../../../Components/AutoImport/String/Label';
import { tokenToString } from 'typescript';

const fullHeight = css({
  height: '100%',
});

interface JSONandJSEditorProps {
  content: string;
  onSave: (content: string) => void;
}

export function JSONandJSEditor({ content, onSave }: JSONandJSEditorProps) {
  const [editing, setEditing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [editorContent, setEditorContent] = React.useState(content);
  const cursorOffset = React.useRef(0);
  const jsContent = React.useRef('');
  const jsCodeInit = React.useRef(0);
  const jsCodeEnd = React.useRef(0);

  React.useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const editJS = (
    monaco: typeof import('monaco-editor'),
    editor: import('monaco-editor').editor.IStandaloneCodeEditor,
  ) => {
    try {
      setError('');
      const cursorPosition = editor.getPosition();
      const model = editor.getModel();
      if (cursorPosition && model) {
        const editorValue = editor.getValue();
        let totalOffset = 0;
        const tokens = monaco.editor
          .tokenize(editorValue, 'json')
          .reduce<{ token: import('monaco-editor').Token; line: number }[]>(
            (newTokens, tokens, line) => {
              const newT = newTokens.concat(
                tokens.reduce<
                  { token: import('monaco-editor').Token; line: number }[]
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
        const currentTokenIndex = tokens.findIndex((t, i) => {
          const currentOffset = model.getOffsetAt(cursorPosition);
          return (
            t.token.offset < currentOffset &&
            (i + 1 === tokens.length ||
              tokens[i + 1].token.offset > currentOffset)
          );
        });
        if (currentTokenIndex < 0) throw 'No selection';
        // 2. Reverse find the first key "script" token
        let keyTokenIndex = tokens
          .slice(0, currentTokenIndex + 1)
          .reverse()
          .findIndex(
            (t, i) =>
              t.token.type === 'string.key.json' &&
              i + 1 !== tokens.length &&
              model
                .getLineContent(t.line)
                .substring(t.token.offset, tokens[i + 1].token.offset)
                .indexOf('script') > -1,
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
            //If line changes between tokens, remove 1 char (\n)
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
      setError(e);
      setTimeout(() => setError(''), 10000);
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
        <button onClick={() => onSave(editorContent)}>Save</button>
        {error && <StyledLabel type={'error'} value={error} />}
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
              <SrcEditor
                value={jsContent.current}
                language={'typescript'}
                onChange={value => {
                  jsContent.current = value;
                }}
                defaultFocus={true}
                defaultExtraLibs={[
                  {
                    // content: definitions,
                    content:
                      'declare function variable(variableName: string): number | string;\n',
                    // `interface cls ${JSON.stringify(myClasses)}
                    //   type gm = {}
                    //  const gameModel:gm;
                    //  namespace Variable {
                    //    export function find(gameModel:gm, name: keyof cls):string
                    //  }
                    // `,
                    name: 'Userscript.d.ts',
                  },
                ]}
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
          onSave={onSave}
          cursorOffset={cursorOffset.current}
          defaultFocus={true}
          defaultKeyEvents={[
            {
              keys: KeyMod.Alt | KeyCode.RightArrow,
              event: editJS,
            },
          ]}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
