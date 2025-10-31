import React from 'react';
import { css } from '@emotion/css';
import { themeVar } from '../Theme/ThemeVars';
import { Config } from 'jodit/types/config';
import { ButtonsGroups, DeepPartial } from 'jodit/types/types';
import { Jodit } from 'jodit';
import sanitize, { toFullUrl, toInjectorStyle } from '../../Helper/sanitize';
import JoditEditor from 'jodit-react';
import { IJodit } from 'jodit/esm/types/jodit';
import { classesCTX } from '../Contexts/ClassesProvider';

type FilePickerCallBackType = ((callback: (path: string) => void) => void) | undefined;

export interface JoditEditorProps {
  /**
   * value - content to inject in the editor
   */
  value: string;
  /**
   * When no content, this text is displayed in the editor
   */
  placeholder: string;
  /**
   * the editor is disabled
   */
  disabled: boolean;
  /**
   * read only mode
   */
  readonly: boolean;
  /**
   * onChange - function called each time the content of the editor changes
   */
  onChange?: (content: string) => void;
  /**
   * Notifies the parent component to show the file picker
   * @param callback function to be called with path to media
   */
  showFilePickerFunc?: FilePickerCallBackType;
  /**
   * full => with link and image insertion and html raw edition
   * player => w/o the above
   */
  toolbarLayout: 'full' | 'player';
}

const wysiwygStyle = css({
  backgroundColor: themeVar.colors.BackgroundColor,
  color: themeVar.colors.DarkTextColor,
});

const IMG_PLACEHOLDER = 'IMG_PLACEHOLDER';
const SRC_PLACEHOLDER = 'SRC_PLACEHOLDER';

function getButtonConfig(layout: 'full' | 'player' | undefined): ButtonsGroups {
  switch (layout) {
    case 'full':
      return [
        'italic',
        'bold',
        'underline',
        '|',
        'ul',
        'ol',
        '|',
        /*'left',
        'center',
        'right',
        'justify',*/
        'customAlignement',
        '|',
        'link',
        IMG_PLACEHOLDER,
        '|',
        SRC_PLACEHOLDER,
        'table',
        '|',
        'paragraph',
        'fontsize',
        'brush',
        'classSpan', //'font'
      ];
    case 'player':
    default:
      // without image, link and raw html buttons
      return [
        'italic',
        'bold',
        'underline',
        '|',
        'ul',
        'ol',
        '|',
        /*'left',
        'center',
        'right',
        'justify',*/
        'customAlignement',
        '|',
        'table',
        '|',
        'paragraph',
        'fontsize',
        'brush',
        'classSpan'
      ];
  }
}

const disabledPlugins : string[] = [
  'add-new-line',
  'drag-and-drop',
  'drag-and-drop-element',
  'iframe',
  'video',
  'print',
  'media',
  'powered-by-jodit',
];

function addCustomFunctions(buttonsConfig: ButtonsGroups, showFilePickerFunc: FilePickerCallBackType):void {

  const imgIndex = buttonsConfig.findIndex(e => e === IMG_PLACEHOLDER);
  //custom button for WEGAS images
  if (imgIndex > -1) {
    buttonsConfig[imgIndex] = {
      icon: 'image',
      tooltip: 'Image',
      exec: function (editor: Jodit) {
        if (showFilePickerFunc) {
          const s = editor.selection;
          showFilePickerFunc(path => {
            s.focus();
            s.restore();
            s.insertImage(path);
          });
        }
      },
    };
  }

  const sourceIndex = buttonsConfig.findIndex(e => e === SRC_PLACEHOLDER);
  //custom button for source mode
  if (sourceIndex > -1) {
    const WYSIWYG = Jodit.constants.MODE_WYSIWYG;
    const SPLIT = Jodit.constants.MODE_SPLIT;

    buttonsConfig[sourceIndex] = {
      icon: 'source',
      tooltip: 'Source',
      exec: function (editor: Jodit) {
        editor.setMode(editor.getMode() === WYSIWYG ? SPLIT : WYSIWYG);
      },
    };
  }
}

/***************** REACT COMPONENT ***************/
export default function JoditReactEditor2({
  value,
  onChange,
  placeholder,
  readonly,
  disabled,
  showFilePickerFunc,
  toolbarLayout,
}: JoditEditorProps){

  const { classes } = React.useContext(classesCTX);

  const configuration : DeepPartial<Config> = React.useMemo(() => {
    const btnConfig = getButtonConfig(toolbarLayout);

    addCustomFunctions(btnConfig, showFilePickerFunc);
    const config: DeepPartial<Config> =  {
      defaultActionOnPaste : 'insert_only_text',
      askBeforePasteFromWord : false,
      askBeforePasteHTML : false,
      statusbar: false,
      disablePlugins : disabledPlugins,
      buttons: btnConfig,
      buttonsMD: btnConfig,
      buttonsSM: btnConfig,
      buttonsXS: btnConfig,
      readonly: readonly,
      disabled: disabled,
      placeholder: placeholder || '',
      //toolbarButtonSize: 'large',
      controls: {
        customAlignement: {
          icon: 'dots',
          tooltip: 'Alignement',
          list: {
            left: 'left',
            center : 'center',
            right : 'right',
            justify: 'justify',
          },
        },
        classSpan: { }
      }
    };

    if (Object.keys(classes).length && config.controls?.classSpan) {
      config.controls.classSpan.list = classes;
    } else {
      config.removeButtons = ['classSpan'];
    }

    return config;

  }, [disabled, readonly, showFilePickerFunc, placeholder, classes]);


  const lastEditorChange = React.useRef(value);
  const joditRef = React.useRef<IJodit>();
  const setRef = React.useCallback((j : IJodit) => (joditRef.current = j), []);

  // Update strategy: to avoid stutter and caret jumps,
  // all incoming changes are ignored when the editor is focused
  const updatedValue = joditRef.current?.isFocused ? lastEditorChange.current : toFullUrl(value);

  const onChangeCallback = React.useCallback(
    (value: string) => {
      lastEditorChange.current = value;
      const v = sanitize(value.replace(/\n/g, ''));
      if (onChange) {
        const injected = toInjectorStyle(v);
        onChange(injected);
      }
    },
    [onChange],
  );

  return (
    <div className={wysiwygStyle}>
      <JoditEditor
        value={updatedValue}
        config={configuration}
        onChange={(s) => onChangeCallback(s)}
        editorRef={setRef}
      />
    </div>
  )
}
