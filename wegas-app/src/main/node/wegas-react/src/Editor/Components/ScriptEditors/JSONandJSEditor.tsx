import { css } from '@emotion/css';
import * as React from 'react';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { Toolbar } from '../../../Components/Toolbar';
import { defaultPadding } from '../../../css/classes';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { MessageString, MessageStringStyle } from '../MessageString';
import { EmbeddedEditor } from './EmbeddedSrcEditor';

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
  const i18nValues = useInternalTranslate(commonTranslations);
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
      <Toolbar.Header className={defaultPadding}>
        <IconButton
          icon="save"
          tooltip={i18nValues.save}
          chipStyle
          onClick={trySave}
        />
        {error !== undefined && (
          <MessageString
            type={error.status}
            value={error.text}
            duration={infoDuration}
          />
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        <EmbeddedEditor
          value={content}
          language="json"
          onChange={val => (editorContent.current = val)}
          onSave={trySave}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
