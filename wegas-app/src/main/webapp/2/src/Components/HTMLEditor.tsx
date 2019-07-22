import * as React from 'react';

// Import TinyMCE
import 'tinymce/tinymce';
// A theme is also required
import 'tinymce/themes/silver';
// Any plugins you want to use has to be imported
import 'tinymce/plugins/save';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';
import 'tinymce/plugins/code';
import 'tinymce/plugins/table';
import 'tinymce/plugins/paste';
import 'tinymce/plugins/advlist';
// Skins must also be imported
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/content/default/content.css';
import 'tinymce/skins/ui/oxide/content.min.css';

import { Editor } from '@tinymce/tinymce-react';
import { Modal } from './Modal';
import { generateAbsolutePath } from '../API/files.api';
import { WidgetProps } from 'jsoninput/typings/types';
import {
  CommonView,
  CommonViewContainer,
} from '../Editor/Components/FormView/commonView';
import { LabeledView, Labeled } from '../Editor/Components/FormView/labeled';
import { primary, primaryLight, primaryDark } from './Theme';
import {
  FileBrowser,
  fileURL,
} from '../Editor/Components/FileBrowser/TreeFileBrowser/FileBrowser';
import { css } from 'emotion';

const toolbar = css({
  width: '300px',
});

// TODO : make a hook that gets user styles (useUserStyles)
const userstyles = [
  { title: 'my custom style 1', block: 'div', classes: 'customStyle1' },
  { title: 'my custom style 2', block: 'div', classes: 'customStyle2' },
  { title: 'my custom style 3', block: 'div', classes: 'customStyle3' },
];

type CallbackFN = (url: string) => void;

interface HTMLEditorProps {
  /**
   * value - content to inject in the editor
   */
  value?: string;
  /**
   * onSave - function called when the save button is pressed or ctrl+S
   */
  onSave?: (content: string) => void;
  /**
   * onChange - function called each time the content of the editor changes
   */
  onChange?: (content: string) => void;
}

let id = 0;

export function HTMLEditor({ value, onSave, onChange }: HTMLEditorProps) {
  const [fileBrowsing, setFileBrowsing] = React.useState<{ fn?: CallbackFN }>(
    {},
  );
  const [editorFocus, setEditorFocus] = React.useState<boolean>(false);
  const HTMLContent = React.useRef('');
  const HTMLEditor = React.useRef<{ focus: () => void }>();

  const config = (toolBarContainerId: string) => {
    return {
      theme: 'silver',
      inline: true,
      browser_spellcheck: true,
      plugins: [
        `${onSave ? 'save' : ''} autolink link image lists code media table`,
        'paste advlist',
      ],
      toolbar: `${
        onSave ? 'save' : ''
      } bold italic underline bullist image | alignleft aligncenter alignright alignjustify link code media table forecolor backcolor styleselect fontsizeselect clientclassselection`,
      toolbar_drawer: 'floating',
      menubar: false,
      resize: 'both',
      statusbar: true,
      branding: false,
      relative_urls: false,
      toolbar_items_size: 'small',
      file_picker_callback: (callback: CallbackFN) =>
        setFileBrowsing({ fn: callback }),
      save_onsavecallback: () => onSave && onSave(HTMLContent.current),
      fixed_toolbar_container: '#' + toolBarContainerId,
      style_formats: [
        {
          title: 'Headers',
          items: [
            { title: 'h1', block: 'h1' },
            { title: 'h2', block: 'h2' },
            { title: 'h3', block: 'h3' },
            { title: 'h4', block: 'h4' },
            { title: 'h5', block: 'h5' },
            { title: 'h6', block: 'h6' },
          ],
        },
        {
          title: 'Containers',
          items: [
            { title: 'div', block: 'div' },
            { title: 'span', block: 'span' },
          ],
        },
        {
          title: 'Wegas styles',
          items: [
            { title: 'primary', block: 'div', classes: primary },
            { title: 'primaryDark', block: 'div', classes: primaryDark },
            { title: 'primaryLight', block: 'div', classes: primaryLight },
          ],
        },
        {
          title: 'User styles',
          items: userstyles,
        },
      ],
    };
  };

  React.useEffect(() => {
    // Ugly workaround...
    const tinyMCEModal = document.getElementsByClassName(
      'tox-dialog-wrap',
    )[0] as HTMLElement;
    if (tinyMCEModal) {
      tinyMCEModal.style.visibility = fileBrowsing.fn ? 'hidden' : 'visible';
    }
  }, [fileBrowsing.fn]);

  const toolBarId = 'externalEditorToolbar' + String(id++);

  return (
    <div>
      <div style={{ visibility: fileBrowsing.fn ? 'hidden' : 'visible' }}>
        <div id={toolBarId} className={toolbar}>
          {!editorFocus && (
            <img
              src={require(onSave
                ? '../pictures/tinymcetoolbar.png'
                : '../pictures/tinymcetoolbarnosave.png')}
              onClick={() => HTMLEditor.current && HTMLEditor.current.focus()}
            />
          )}
        </div>

        <Editor
          initialValue={value}
          init={config(toolBarId)}
          onInit={editor => (HTMLEditor.current = editor.target)}
          onChange={(val: { level: { content: string } }) => {
            HTMLContent.current = val.level.content;
            onChange && onChange(val.level.content);
          }}
          onFocus={() => setEditorFocus(true)}
          onBlur={() => setEditorFocus(false)}
        />
      </div>
      {fileBrowsing.fn && (
        <Modal>
          <FileBrowser
            onFileClick={file => {
              setFileBrowsing({});
              file &&
                fileBrowsing.fn &&
                fileBrowsing.fn(
                  document.location.origin +
                    fileURL(generateAbsolutePath(file)),
                );
            }}
          />
        </Modal>
      )}
    </div>
  );
}

interface HtmlProps
  extends WidgetProps.BaseProps<
    { placeholder?: string } & CommonView & LabeledView
  > {
  value?: string;
}
interface HtmlState {
  value: string;
  oldProps: HtmlProps;
}
export class LabeledHTMLEditor extends React.Component<HtmlProps, HtmlState> {
  static getDerivedStateFromProps(nextProps: HtmlProps, state: HtmlState) {
    if (state.oldProps === nextProps) {
      return null;
    }
    if (state.value !== nextProps.value) {
      return {
        oldProps: nextProps,
        value: nextProps.value,
      };
    }
    return { oldProps: nextProps };
  }
  state = {
    oldProps: this.props,
    value: this.props.value || '<p></p>',
  };
  onChange = (value: string) => {
    if (this.state.value !== value) {
      const oldVal = this.state.value;
      this.setState({ value }, () => {
        if (oldVal !== this.state.value) {
          this.props.onChange(this.state.value);
        }
      });
    } else {
      this.setState({ value });
    }
  };

  render() {
    return (
      <CommonViewContainer
        view={this.props.view}
        errorMessage={this.props.errorMessage}
      >
        <Labeled {...this.props.view}>
          {({ labelNode /*, inputId*/ }) => (
            <>
              {labelNode}
              <HTMLEditor value={this.state.value} onChange={this.onChange} />
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
