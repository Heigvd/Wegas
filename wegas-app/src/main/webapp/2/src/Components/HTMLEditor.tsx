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
import { DndFileBrowser } from '../Editor/Components/FileBrowser/TreeFileBrowser/FileBrowser';
import { Modal } from './Modal';
import { FileAPI } from '../API/files.api';
import { getAbsoluteFileName } from '../data/methods/ContentDescriptor';
import { WidgetProps } from 'jsoninput/typings/types';
import {
  CommonView,
  CommonViewContainer,
} from '../Editor/Components/FormView/commonView';
import { LabeledView, Labeled } from '../Editor/Components/FormView/labeled';
import { primary, primaryLight, primaryDark } from './Theme';

type CallbackFN = (url: string) => void;

interface HTMLEditorProps {
  /**
   * value - content to inject in the editor
   */
  value?: string;
  /**
   * onSave - function called when the floppy button is pressed
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
  const HTMLContent = React.useRef('');

  const config = (toolBarContainerId: string) => {
    return {
      theme: 'silver',
      inline: true,
      browser_spellcheck: true,
      plugins: [
        `${onSave ? 'save' : ''} autolink link image lists code media table`,
        'paste advlist',
      ],
      toolbar1: `${
        onSave ? 'save' : ''
      } | bold italic bullist | link image media code`,
      toolbar2: `forecolor backcolor underline
         alignleft aligncenter alignright alignjustify table`,
      toolbar3: 'fontsizeselect styleselect',
      menubar: false,
      resize: 'both',
      statusbar: true,
      branding: false,
      relative_urls: false,
      toolbar_items_size: 'small',
      hidden_tootlbar: [2, 3],
      file_picker_callback: (callback: CallbackFN) =>
        setFileBrowsing({ fn: callback }),
      save_onsavecallback: () => onSave && onSave(HTMLContent.current),
      fixed_toolbar_container: '#' + toolBarContainerId,
      // formats: {
      //   alignleft: {
      //     selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img',
      //     classes: 'left',
      //   },
      //   aligncenter: {
      //     selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img',
      //     classes: 'center',
      //   },
      //   alignright: {
      //     selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img',
      //     classes: 'right',
      //   },
      //   alignfull: {
      //     selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img',
      //     classes: 'full',
      //   },
      //   bold: { inline: 'span', classes: 'bold' },
      //   italic: { inline: 'span', classes: 'italic' },
      //   underline: { inline: 'span', classes: 'underline', exact: true },
      //   strikethrough: { inline: 'del' },
      //   customformat: {
      //     inline: 'span',
      //     styles: { color: '#00ff00', fontSize: '20px' },
      //     attributes: { title: 'My custom format' },
      //     classes: 'example1',
      //   },
      // },
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
          title: 'Wegas styles',
          items: [
            { title: 'primary', block: 'div', classes: primary },
            { title: 'primaryDark', block: 'div', classes: primaryDark },
            { title: 'primaryLight', block: 'div', classes: primaryLight },
          ],
        },
        {
          title: 'Containers',
          items: [
            { title: 'div', block: 'div' },
            { title: 'span', block: 'span' },
          ],
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
        <div id={toolBarId} />
        <Editor
          initialValue={value}
          init={config(toolBarId)}
          onChange={(val: { level: { content: string } }) => {
            HTMLContent.current = val.level.content;
            onChange && onChange(val.level.content);
          }}
        />
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
