import * as React from 'react';

// Import TinyMCE
import 'tinymce/tinymce';
// A theme is also required
import 'tinymce/themes/silver';
// Any plugins you want to use has to be imported
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';
import 'tinymce/plugins/code';
import 'tinymce/plugins/table';
import 'tinymce/plugins/paste';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/textcolor';
// 'autolink link image lists code media table',
// 'paste advlist textcolor',

import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/content/default/content.css';
import 'tinymce/skins/ui/oxide/content.min.css';

import { Editor } from '@tinymce/tinymce-react';
import { DndFileBrowser } from '../Editor/Components/FileBrowser/TreeFileBrowser/FileBrowser';
import { Modal } from './Modal';
import { FileAPI } from '../API/files.api';
import { getAbsoluteFileName } from '../data/methods/ContentDescriptor';

type CallbackFN = (url: string) => void;

interface HTMLEditorProps {
  /**
   * content - content to inject in the editor
   */
  content: string;
  /**
   * onSave - function called when the floppy button is pressed
   */
  onSave?: (content: string) => void;
  /**
   * onChange - function called each time the content of the editor changes
   */
  onChange?: (content: string) => void;
}

export function HTMLEditor({ content, onSave, onChange }: HTMLEditorProps) {
  const [state, setState] = React.useState<{
    error?: unknown;
    data?: 'O';
    status: 'pending' | 'resolved' | 'rejected';
  }>({ status: 'pending' });
  const [fileBrowsing, setFileBrowsing] = React.useState<{ fn?: CallbackFN }>(
    {},
  );

  const config = {
    inline: false,
    browser_spellcheck: true,
    plugins: [
      'autolink link image lists code media table',
      'paste advlist textcolor',
    ],
    toolbar1: 'bold italic bullist | link image media code',
    toolbar2: `forecolor backcolor underline
         alignleft aligncenter alignright alignjustify table`,
    toolbar3: 'fontsizeselect styleselect',
    menubar: false,
    resize: 'both',
    max_height: 500,
    statusbar: true,
    branding: false,
    relative_urls: false,
    toolbar_items_size: 'small',
    hidden_tootlbar: [2, 3],
    file_picker_callback: (callback: CallbackFN) => {
      setFileBrowsing({ fn: callback });
    },
  };

  React.useEffect(() => {
    // Ugly workaround...
    document
      .getElementsByClassName('tox tox-silver-sink tox-tinymce-aux')[0]
      .setAttribute(
        'style',
        'visibility:' + fileBrowsing.fn ? 'hidden' : 'visible',
      );
  }, [fileBrowsing.fn]);

  return (
    <div>
      <div style={{ visibility: fileBrowsing.fn ? 'hidden' : 'visible' }}>
        <Editor initialValue={content} init={config} onChange={onChange} />
      </div>
      {fileBrowsing.fn && (
        <Modal>
          <DndFileBrowser
            onFileClick={file => {
              setFileBrowsing({});
              file &&
                fileBrowsing.fn &&
                fileBrowsing.fn(
                  document.location.origin +
                    FileAPI.fileURL(getAbsoluteFileName(file)),
                );
            }}
          />
        </Modal>
      )}
    </div>
  );
}
