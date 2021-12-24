import { css } from '@emotion/css';
import { Editor as TinyEditor } from '@tinymce/tinymce-react';
import { ITinyEvents } from '@tinymce/tinymce-react/lib/cjs/main/ts/Events';
import * as React from 'react';
import { RawEditorSettings } from 'tinymce/tinymce';
import { fileURL, generateAbsolutePath } from '../../API/files.api';
import { useThemeStore } from '../../data/Stores/themeStore';
import { ErrorBoundary } from '../../Editor/Components/ErrorBoundary';
import { FileBrowser } from '../../Editor/Components/FileBrowser/FileBrowser';
import { classNameOrEmpty } from '../../Helper/className';
import { classesCTX } from '../Contexts/ClassesProvider';
import { inputDefaultCSS, inputStyleCSS } from '../Inputs/SimpleInput';
import { Modal } from '../Modal';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeCTX } from '../Theme/Theme';
import { defaultLightMode, modeStyle, themeVar } from '../Theme/ThemeVars';

// tinymce.EditorManager.execCommand('mceRemoveEditor', false, 'myEditor');
// tinymce.EditorManager.execCommand('mceAddEditor', false, 'myEditor');

const fontUrl =
  require('../../css/fonts/Raleway-VariableFont_wght.ttf').default;
const fontItalicUrl =
  require('../../css/fonts/Raleway-Italic-VariableFont_wght.ttf').default;

const toolbar = css({
  width: '300px',
});

const editorStyle = css({
  minWidth: '25em',
  minHeight: '200px',
  '& .mce-content-body': {
    ...inputDefaultCSS,
    ...inputStyleCSS,
  },
});

type CallbackFN = (url: string) => void;

// interface StyleButton {
//   name: string;
//   block?: 'span' | 'div';
//   className: string;
//   icon?: TinyMCEIcons;
//   text?: string;
//   tooltip?: string;
// }

interface ActionButton {
  name: string;
  text?: string;
  icon?: TinyMCEIcons;
  tooltip?: string;
  disabled?: boolean;
  active?: boolean;
  onSetup?: (
    api: TinyMCEButtonAPI,
    editor: TinyMCEEditor,
  ) => (api: TinyMCEButtonAPI) => void;
  onAction: (api: TinyMCEButtonAPI, editor: TinyMCEEditor) => void;
}

export interface HTMLEditorProps extends ClassStyleId, DisabledReadonly {
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
  /**
   * delay - timeout to avoid frequent onChange updates
   */
  delay?: number;
  /**
   * inline - enables the editor after a click on it
   * @default true
   */
  inline?: boolean;
  /**
   * When no content, this text is displayed in the editor
   */
  placeholder?: string;
  /**
   * the editor is disabled
   */
  disabled?: boolean;
  /**
   * the editor is in read only mode
   */
  readOnly?: boolean;
  /**
   * avoid resizing of the editor
   */
  noResize?: boolean;
  /**
   * avoid forcing <p> block
   */
  noRootBlock?: boolean;
  /**
   * displays the internal value while the input value is not changed
   */
  keepInternalValue?: boolean;
  /**
   * display a custom toolbar
   */
  customToolbar?: string;
}

let HTMLEditorID = 0;

export default function HTMLEditor({
  value,
  onSave,
  onChange,
  className,
  style,
  id,
  inline = false,
  placeholder,
  disabled,
  readOnly,
  noResize,
  noRootBlock,
  keepInternalValue,
  customToolbar,
}: HTMLEditorProps) {
  const toolBarIdRef = React.useRef(
    'externalEditorToolbar' + String(HTMLEditorID++),
  );
  const [fileBrowsing, setFileBrowsing] = React.useState<{ fn?: CallbackFN }>(
    {},
  );
  const [editorFocus, setEditorFocus] = React.useState<boolean>(false);
  const HTMLContent = React.useRef('');
  const HTMLEditor = React.useRef<{ focus: () => void; destroy: () => void }>();
  const { classes } = React.useContext(classesCTX);

  const themesState = useThemeStore(s => s);
  const { currentContext, currentMode } = React.useContext(themeCTX);
  const currentTheme =
    themesState.themes[themesState.selectedThemes[currentContext]];
  const wegasStyle = modeStyle(
    currentTheme.values,
    (currentMode && currentTheme.modes[currentMode]) || defaultLightMode,
  );

  //Internal value management
  const [internalValue, setInternalValue] = React.useState(value);
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const onIniteditor = React.useCallback<ITinyEvents['onInit']>(
    (event, _editor) => {
      HTMLEditor.current = event.target;
    },
    [],
  );

  const onEditorChanges = React.useCallback(
    (v: string) => {
      if (
        value !== v &&
        !(value === '<p></p>' && v === '') &&
        !(value === '' && v === '<p></p>')
      ) {
        onChange && onChange(v);
      }
      setInternalValue(v);
      HTMLContent.current = v;
    },
    [onChange, value],
  );

  function onFocus() {
    setEditorFocus(true);
  }

  function onBlur() {
    setEditorFocus(false);
  }

  const config = React.useMemo(() => {
    // const extraStyleButton: StyleButton[] = [
    //   {
    //     name: 'testbutton',
    //     text: 'test',
    //     className: 'testclass',
    //   },
    // ];
    const extraActionButton: ActionButton[] = [
      {
        name: 'addDivImage',
        icon: 'image',
        onAction: (_api, editor) => {
          setFileBrowsing({
            fn: path => {
              editor.insertContent(
                `<div style="background-image:url(${path}); width:100%; height:100%; background-position: center; background-size: contain; background-repeat: no-repeat;"></div>`,
              );
            },
          });
        },
      },
    ];

    const config: RawEditorSettings & {
      selector?: undefined;
      target?: undefined;
    } = {
      theme: 'silver',
      inline: inline,
      readonly: readOnly,
      min_width: 464,
      width: '100%',
      placeholder,
      browser_spellcheck: true,
      plugins: [
        `${onSave ? 'save' : ''} autolink link image lists code media table`,
        'paste advlist',
      ],
      toolbar: customToolbar
        ? customToolbar
        : `${
            onSave && isActionAllowed({ disabled, readOnly }) ? 'save' : ''
          } bold italic underline bullist image | alignleft aligncenter alignright alignjustify link | ${[
            // ...extraStyleButton,
            ...extraActionButton,
          ]
            .map(btn => btn.name)
            .join(
              ' ',
            )} | code media table forecolor backcolor styleselect fontsizeselect clientclassselection`,
      toolbar_drawer: 'floating',
      menubar: false,
      resize: disabled || noResize ? false : 'both',
      statusbar: true,
      branding: false,
      relative_urls: false,
      toolbar_items_size: 'small',
      ...(noRootBlock ? { forced_root_block: '' } : {}),
      file_picker_callback: (callback: CallbackFN) =>
        setFileBrowsing({ fn: callback }),
      save_onsavecallback: () =>
        onSave &&
        isActionAllowed({ disabled, readOnly }) &&
        onSave(HTMLContent.current),
      fixed_toolbar_container: '#' + toolBarIdRef.current,
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
          items: classes.map(c => ({ title: c, block: 'div', classes: c })),
        },
        // {
        //   title: 'User styles',
        //   items: extraStyleButton.map(btn => ({
        //     title: btn.name,
        //     block: btn.block ? btn.block : 'span',
        //     classes: btn.className,
        //   })),
        // },
      ],
      forced_root_block: '',
      setup: function (editor: TinyMCEEditor) {
        // let formatter: EditorFormatter | undefined;
        // editor.on('init', () => {
        //   formatter = editor.formatter;
        // });
        // editor.on('blur', () => {
        //   // TODO : find a way to close the expended toolbar to avoid bug
        //   // editor.execCommand('commandName');
        //   // wlog(e);
        //   // debugger;
        // });
        // extraStyleButton.forEach(btn => {
        //   editor.ui.registry.addToggleButton(btn.name, {
        //     text: btn.text,
        //     icon: btn.icon,
        //     tooltip: btn.tooltip,
        //     onAction: () => {
        //       formatter && formatter.toggle(`custom-${btn.name}`);
        //       editor.fire('change', {
        //         event: {
        //           target: {
        //             getContent: editor.getContent,
        //           },
        //         },
        //       });
        //     },
        //     onSetup: (buttonApi: TinyMCEToggleButtonAPI) => {
        //       // Getting the class of the current token to define button state
        //       const editorEventCallback = (
        //         eventApi: TinyMCENodeChangeEvent,
        //       ) => {
        //         buttonApi.setActive(
        //           eventApi.element.className.includes(btn.className),
        //         );
        //       };
        //       editor.on('nodechange', editorEventCallback);
        //       return () => editor.off('nodechange', editorEventCallback);
        //     },
        //   });
        // });

        extraActionButton.forEach(btn => {
          editor.ui.registry.addButton(btn.name, {
            ...btn,
            onAction: api => btn.onAction(api, editor),
            onSetup: api => (btn.onSetup ? btn.onSetup(api, editor) : () => {}),
          });
        });
      },
      content_style: `
      @font-face {
        font-family: "Raleway";
        src: url("${fontUrl}") format('ttf supports variations'),
             url("${fontUrl}") format('ttf-variations'),
             url("${fontUrl}");
        font-weight: 100 800;
        font-stretch: 25% 151%;
        }
        @font-face {
          font-family: "Raleway";
          src: url("${fontItalicUrl}") format('ttf supports variations'),
               url("${fontItalicUrl}") format('ttf-variations'),
               url("${fontItalicUrl}");
          font-weight: 100 800;
          font-stretch: 25% 151%;
          font-style: italic;
          }
          html {
          font-size: 1em;
          font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol';
          line-height: 1.15em;
          box-sizing: border-box;
          color: #232323;
        }

        body {
          ${Object.entries(wegasStyle)
            .map(([k, v]) => k + ':' + v)
            .join(';')}  ;
          font-family: ${themeVar.others.TextFont2}; 
        }`,
      // init_instance_callback: function (editor) {
      //   editor.on('ExecCommand', function (e) {
      //     wlog('The ' + e.command + ' command was fired.');
      //     debugger;
      //   });
      // },
    };
    return config;
  }, [
    inline,
    readOnly,
    placeholder,
    onSave,
    disabled,
    noResize,
    noRootBlock,
    classes,
    wegasStyle,
  ]);

  React.useEffect(() => {
    // Ugly workaround...
    const tinyMCEModal = document.getElementsByClassName(
      'tox-dialog-wrap',
    )[0] as HTMLElement;
    if (tinyMCEModal) {
      tinyMCEModal.style.visibility = fileBrowsing.fn ? 'hidden' : 'visible';
    }
  }, [fileBrowsing.fn]);

  React.useEffect(() => {
    // wlog('START');
    return () => {
      // wlog('DESTROY');
      HTMLEditor.current?.destroy();
    };
  }, []);

  return (
    <div
      className={editorStyle + classNameOrEmpty(className)}
      style={style}
      id={id}
    >
      <div
        style={{
          visibility: fileBrowsing.fn ? 'hidden' : 'visible',
          minWidth: 464,
        }}
      >
        {inline && (
          <div id={toolBarIdRef.current} className={toolbar}>
            {!editorFocus && (
              <img
                src={
                  require(onSave
                    ? '../../pictures/tinymcetoolbar.png'
                    : '../../pictures/tinymcetoolbarnosave.png').default
                }
                onClick={() => HTMLEditor.current && HTMLEditor.current.focus()}
              />
            )}
          </div>
        )}
        <ErrorBoundary>
          <TinyEditor
            apiKey="xkafxh5bjijfa83806ycen9yltz2aw447z0lwlgkn319sk6p"
            value={keepInternalValue ? internalValue : value}
            init={config}
            onInit={onIniteditor}
            onEditorChange={onEditorChanges}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={disabled}
          />
        </ErrorBoundary>
      </div>
      {fileBrowsing.fn && (
        <Modal onExit={() => setFileBrowsing({})}>
          <FileBrowser
            onFileClick={file=> {
              setFileBrowsing({});
              file &&
                fileBrowsing.fn &&
                fileBrowsing.fn(
                  document.location.origin +
                    fileURL(generateAbsolutePath(file)),
                );
            }}
            pickType={'FILE'}
            filter={{ fileType: 'image', filterType: 'show' }}
          />
        </Modal>
      )}
    </div>
  );
}
