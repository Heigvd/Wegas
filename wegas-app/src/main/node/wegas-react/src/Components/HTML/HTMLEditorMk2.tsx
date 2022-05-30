// import { css } from '@emotion/css';
// import { Editor as TinyEditor } from '@tinymce/tinymce-react';
// import { ITinyEvents } from '@tinymce/tinymce-react/lib/cjs/main/ts/Events';
import * as React from 'react';
// import { RawEditorSettings } from 'tinymce/tinymce';
import { fileURL, generateAbsolutePath } from '../../API/files.api';
// import { fileURL, generateAbsolutePath } from '../../API/files.api';
import { useThemeStore } from '../../data/Stores/themeStore';
import { FileBrowser } from '../../Editor/Components/FileBrowser/FileBrowser';
import { classNameOrEmpty } from '../../Helper/className';
import { wlog } from '../../Helper/wegaslog';
// import { ErrorBoundary } from '../../Editor/Components/ErrorBoundary';
// import { FileBrowser } from '../../Editor/Components/FileBrowser/FileBrowser';
// import { classNameOrEmpty } from '../../Helper/className';
// import { classesCTX } from '../Contexts/ClassesProvider';
// import { inputDefaultCSS, inputStyleCSS } from '../Inputs/SimpleInput';
import { Modal } from '../Modal';
// import { Modal } from '../Modal';
// import { isActionAllowed } from '../PageComponents/tools/options';
import { themeCTX } from '../Theme/Theme';
import { defaultLightMode, modeStyle, themeVar } from '../Theme/ThemeVars';
import JoditReactEditor from './JoditReactEditor';

// tinymce.EditorManager.execCommand('mceRemoveEditor', false, 'myEditor');
// tinymce.EditorManager.execCommand('mceAddEditor', false, 'myEditor');

// const fontUrl =
//   require('../../css/fonts/Raleway-VariableFont_wght.ttf').default;
// const fontItalicUrl =
//   require('../../css/fonts/Raleway-Italic-VariableFont_wght.ttf').default;

// const toolbar = css({
//   width: '300px',
// });

// const editorStyle = css({
//   minWidth: '25em',
//   minHeight: '200px',
//   '& .mce-content-body': {
//     ...inputDefaultCSS,
//     ...inputStyleCSS,
//   },
// });

type CallbackFN = (url: string) => void;

// interface StyleButton {
//   name: string;
//   block?: 'span' | 'div';
//   className: string;
//   icon?: TinyMCEIcons;
//   text?: string;
//   tooltip?: string;
// }

// interface ActionButton {
//   name: string;
//   text?: string;
//   icon?: TinyMCEIcons;
//   tooltip?: string;
//   disabled?: boolean;
//   active?: boolean;
//   onSetup?: (
//     api: TinyMCEButtonAPI,
//     editor: TinyMCEEditor,
//   ) => (api: TinyMCEButtonAPI) => void;
//   onAction: (api: TinyMCEButtonAPI, editor: TinyMCEEditor) => void;
// }

export interface HTMLEditorPropsMk2 extends ClassStyleId, DisabledReadonly {
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
  customToolbar?: "full" | "player";

}

let HTMLEditorID = 0;

export default function HTMLEditorMk2({
  value,
  onSave,
  onChange,
  className,
  style,
  id,
  // inline = false,
  placeholder,
  disabled,
  readOnly,
  noResize,
  noRootBlock,
  keepInternalValue,
  customToolbar: toolbarLayout,
}: HTMLEditorPropsMk2) {
  // const toolBarIdRef = React.useRef('externalEditorToolbar' + String(HTMLEditorID++));
  const [fileBrowsing, setFileBrowsing] = React.useState<{ fn?: CallbackFN }>({});
  // const [editorFocus, setEditorFocus] = React.useState<boolean>(false);
  const HTMLContent = React.useRef('');
  // const HTMLEditor = React.useRef<{ focus: () => void; destroy: () => void }>();
  // const { classes } = React.useContext(classesCTX);

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

  const onEditorChanges = React.useCallback(
    (v: string) => {
      //TODO clean up
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

  const showFilePicker = React.useCallback((providePathCallBack: ((path: string) => void)) => {
    wlog('showing filepicker');
    setFileBrowsing({fn: providePathCallBack})
  }, [])

  return (
    <div
    className={classNameOrEmpty(className)}
    style={style}
    id={id}
    >
      {/* <div>TODO placeholder image when unselected ?</div> */}
        <JoditReactEditor
          value={keepInternalValue ? internalValue : value}
          onChange={onEditorChanges}
          placeholder={placeholder}
          disabled={disabled}
          readonly={readOnly}
          toolbarLayout={toolbarLayout}
          showFilePickerFunc={showFilePicker}
        />
          {fileBrowsing.fn && (
          <Modal onExit={() => setFileBrowsing({})}>
            <FileBrowser
              onFileClick={file => {
                setFileBrowsing({});
                // wlog('raw file name', file)
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
