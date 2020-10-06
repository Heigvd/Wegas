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
// Skin must also be imported
import 'tinymce/skins/ui/oxide/skin.min.css';

import { Editor as TinyEditor } from '@tinymce/tinymce-react';
import { Modal } from './Modal';
import { generateAbsolutePath, fileURL } from '../API/files.api';
import {
  CommonView,
  CommonViewContainer,
} from '../Editor/Components/FormView/commonView';
import { LabeledView, Labeled } from '../Editor/Components/FormView/labeled';
import { FileBrowser } from '../Editor/Components/FileBrowser/FileBrowser';
import { css, cx } from 'emotion';
import { classesCTX } from './Contexts/ClassesProvider';
import { flexColumn, flex } from '../css/classes';
import { WidgetProps } from 'jsoninput/typings/types';
import { debounce } from 'lodash-es';
import { classNameOrEmpty } from '../Helper/className';
import { inputStyleCSS } from './Inputs/inputStyles';

const toolbar = css({
  width: '300px',
});

const editorStyle = css({
  '& .mce-content-body': inputStyleCSS,
});

type CallbackFN = (url: string) => void;

interface ExtraButton {
  block?: 'span' | 'div';
  className: string;
  cssIcon?: TinyMCEIcons;
  text?: string;
  tooltip?: string;
}

interface ExtraButtons {
  [name: string]: ExtraButton;
}

interface HTMLEditorProps extends ClassAndStyle {
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
  /**
   * id - the id of the main container
   */
  id?: string;
}

let HTMLEditorID = 0;

export default function HTMLEditor({
  value,
  onSave,
  onChange,
  className,
  style,
  id,
}: HTMLEditorProps) {
  const [fileBrowsing, setFileBrowsing] = React.useState<{ fn?: CallbackFN }>(
    {},
  );
  const [editorFocus, setEditorFocus] = React.useState<boolean>(false);
  const HTMLContent = React.useRef('');
  const HTMLEditor = React.useRef<{ focus: () => void }>();
  const { classes } = React.useContext(classesCTX);

  const config = (
    toolBarContainerId: string,
    extraButtons: ExtraButtons = {},
  ) => {
    const extraButtonsKeys = Object.keys(extraButtons);
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
      } bold italic underline bullist image | alignleft aligncenter alignright alignjustify link | ${extraButtonsKeys.join(
        ' ',
      )} | code media table forecolor backcolor styleselect fontsizeselect clientclassselection`,
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
        // {
        //   title: 'Headers',
        //   items: [
        //     { title: 'h1', block: 'h1' },
        //     { title: 'h2', block: 'h2' },
        //     { title: 'h3', block: 'h3' },
        //     { title: 'h4', block: 'h4' },
        //     { title: 'h5', block: 'h5' },
        //     { title: 'h6', block: 'h6' },
        //   ],
        // },
        // {
        //   title: 'Containers',
        //   items: [
        //     { title: 'div', block: 'div' },
        //     { title: 'span', block: 'span' },
        //   ],
        // },
        {
          title: 'Wegas styles',
          items: classes.map(c => ({ title: c, block: 'div', classes: c })),
          // [
          //   { title: 'primary', block: 'div', classes: primary },
          //   { title: 'primaryDark', block: 'div', classes: primaryDark },
          //   { title: 'primaryLight', block: 'div', classes: primaryLight },
          // ],
        },
        {
          title: 'User styles',
          items: extraButtonsKeys.map(btnName => ({
            title: btnName,
            block: extraButtons[btnName].block
              ? extraButtons[btnName].block
              : 'span',
            classes: extraButtons[btnName].className,
          })),
        },
      ],
      setup: function (editor: TinyMCEEditor) {
        let formatter: TinyMCEEditorFormatter | undefined;
        editor.on('init', () => {
          formatter = editor.formatter;
        });
        // editor.on('blur', () => {
        //   // TODO : find a way to close the expended toolbar to avoid bug
        //   // editor.execCommand('commandName');
        //   // wlog(e);
        //   // debugger;
        // });
        extraButtonsKeys.forEach(btnName => {
          editor.ui.registry.addToggleButton(btnName, {
            text: extraButtons[btnName].text,
            icon: extraButtons[btnName].cssIcon,
            onAction: () => {
              formatter && formatter.toggle(`custom-${btnName}`);
              editor.fire('change', {
                event: {
                  target: {
                    getContent: editor.getContent,
                  },
                },
              });
            },
            onSetup: function (buttonApi) {
              // Getting the class of the current token to define button state
              const editorEventCallback = (
                eventApi: TinyMCENodeChangeEvent,
              ) => {
                buttonApi.setActive(
                  eventApi.element.className.includes(
                    extraButtons[btnName].className,
                  ),
                );
              };
              editor.on('nodechange', editorEventCallback);
              return () => editor.off('nodechange', editorEventCallback);
            },
          });
        });
      },
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

  const onEditorChange = React.useCallback(
    debounce((value: string) => {
      HTMLContent.current = value;
      onChange && onChange(HTMLContent.current);
    }, 500),
    [onChange],
  );

  const toolBarId = 'externalEditorToolbar' + String(HTMLEditorID++);

  return (
    <div
      className={editorStyle + classNameOrEmpty(className)}
      style={style}
      id={id}
    >
      <div style={{ visibility: fileBrowsing.fn ? 'hidden' : 'visible' }}>
        <div id={toolBarId} className={toolbar}>
          {!editorFocus && (
            <img
              src={
                require(onSave
                  ? '../pictures/tinymcetoolbar.png'
                  : '../pictures/tinymcetoolbarnosave.png').default
              }
              onClick={() => HTMLEditor.current && HTMLEditor.current.focus()}
            />
          )}
        </div>
        <TinyEditor
          value={value}
          init={config(toolBarId, {
            testbutton: { text: 'test', className: 'testclass' },
          })}
          onInit={editor => (HTMLEditor.current = editor.target)}
          onEditorChange={onEditorChange}
          onFocus={() => setEditorFocus(true)}
          onBlur={() => setEditorFocus(false)}
          // textareaName={editorStyle}
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
            pick={'FILE'}
            filter={{ fileType: 'image', filterType: 'show' }}
          />
        </Modal>
      )}
    </div>
  );
}

const labeledHTMLEditorStyle = css({
  display: 'inline-block',
});

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
  render() {
    return (
      <CommonViewContainer
        view={this.props.view}
        errorMessage={this.props.errorMessage}
      >
        <Labeled {...this.props.view}>
          {({ labelNode, inputId }) => (
            <div className={cx(flex, flexColumn)}>
              {labelNode}
              <HTMLEditor
                value={this.state.value}
                onChange={this.props.onChange}
                className={labeledHTMLEditorStyle}
                id={inputId}
              />
            </div>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
