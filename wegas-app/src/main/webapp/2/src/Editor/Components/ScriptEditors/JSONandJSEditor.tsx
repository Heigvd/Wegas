import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { css } from 'emotion';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { MessageString, MessageStringStyle } from '../MessageString';
import { EmbeddedSrcEditor } from './EmbeddedSrcEditor';
import { WegasScriptEditor } from './WegasScriptEditor';

const infoDuration = 5000;

const fullHeight = css({
  height: '100%',
});

export interface OnSaveStatus {
  status?: MessageStringStyle;
  text?: string;
}

interface JSONandJSEditorProps {
  content: string;
  onSave: (content: string) => OnSaveStatus | void;
  status?: OnSaveStatus;
}

export function JSONandJSEditor({
  content,
  onSave,
  status,
}: JSONandJSEditorProps) {
  const editorContent = React.useRef<string>(content);
  const [error, setError] = React.useState<OnSaveStatus | undefined | void>(
    status,
  );

  React.useEffect(() => setError(status), [status]);

  const trySave = () => {
    setError(onSave(editorContent.current));
  };


  return (
    <Toolbar className={fullHeight}>
      <Toolbar.Header>
        <Button label="Save" onClick={trySave} />
        {error !== undefined && (
          <MessageString
            type={error.status}
            value={error.text}
            duration={infoDuration}
          />
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        <EmbeddedSrcEditor
          value={content}
          defaultUri="internal://page.json"
          language="json"
          onChange={val => editorContent.current = val}
          onSave={trySave}
          EmbeddedEditor={WegasScriptEditor}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
