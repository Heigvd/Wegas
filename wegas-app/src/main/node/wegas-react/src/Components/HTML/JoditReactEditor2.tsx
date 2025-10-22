import React from 'react';
import { css } from '@emotion/css';
import { themeVar } from '../Theme/ThemeVars';
import JoditEditor from 'jodit-react';
import { Config } from 'jodit/types/config';
import { ButtonsGroups, DeepPartial } from 'jodit/types/types';
import { Jodit } from 'jodit';
import sanitize, { toFullUrl, toInjectorStyle } from '../../Helper/sanitize';
import { wlog } from '../../Helper/wegaslog';
//import JoditEditorTemp from './TempJoditReactCopy';

type FilePickerCallBackType = ((callback: (path: string) => void) => void) | undefined;

export interface JoditEditorProps {
  /**
   * value - content to inject in the editor
   */
  value?: string;
  /**
   * When no content, this text is displayed in the editor
   */
  placeholder?: string;
  /**
   * the editor is disabled
   */
  disabled?: boolean;
  /**
   * read only mode
   */
  readonly?: boolean;
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
  toolbarLayout?: 'full' | 'player';
}

/**
 * @param value value to clean
 * @returns a sanitized string stripped of \n
 */
function cleanValue(value: string | undefined): string {
  const v = value || '';
  return sanitize(v.replace(/\n/g, ''));
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
        'left',
        'center',
        'right',
        'justify',
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
        'left',
        'center',
        'right',
        'justify',
        '|',
        'table',
        '|',
        'paragraph',
        'fontsize',
        'brush',
      ];
  }
}

const disabledPlugins : string[] = [
  /*'add-new-line',
  'drag-and-drop',
  'drag-and-drop-element',
  'iframe',
  'video',
  'print',
  'media',
  'powered-by-jodit',*/
];

function addCustomFunctions(buttonsConfig: ButtonsGroups, showFilePickerFunc: FilePickerCallBackType):void {

  const imgIndex = buttonsConfig.findIndex(e => e === IMG_PLACEHOLDER);
  //custom button for WEGAS images
  if (imgIndex > -1) {
    buttonsConfig[imgIndex] = {
      icon: 'image',

      exec: function (editor: Jodit) {
        if (showFilePickerFunc) {
          const s = editor.selection;
          showFilePickerFunc(path => {
            s.focus();
            s.restore();
            s.insertImage(path);
            wlog('INSERTED path ', path)
          });
        }
      },
    };
  }

  const sourceIndex = buttonsConfig.findIndex(e => e === SRC_PLACEHOLDER);
  //custom button for source mode
  if (sourceIndex > -1) {
    buttonsConfig[sourceIndex] = {
      icon: 'source',
      exec: function (editor: Jodit) {
        const WYSIWYG = Jodit.constants.MODE_WYSIWYG;
        const SPLIT = Jodit.constants.MODE_SPLIT;
        const currMode = editor.getMode();
        editor.setMode(currMode === WYSIWYG ? SPLIT : WYSIWYG);
      },
    };
  }
}

/***** REACT COMPONENT *****/
export default function JoditReactEditor2({
  value,
  onChange,
  placeholder,
  readonly,
  disabled,
  showFilePickerFunc,
  toolbarLayout,
}: JoditEditorProps){

  const configRef = React.useRef<DeepPartial<Config>>();

  React.useEffect(() => {
    wlog('use effect config');
    const btnConfig = getButtonConfig(toolbarLayout);

    addCustomFunctions(btnConfig, showFilePickerFunc);
    configRef.current = {
      defaultActionOnPaste : 'insert_only_text',
      disablePlugins : disabledPlugins,
      buttons: btnConfig,
      buttonsMD: btnConfig,
      buttonsSM: btnConfig,
      buttonsXS: btnConfig,
      removeButtons: ['classSpan'],
      readonly: readonly,
      disabled: disabled,
      placeholder: placeholder,
    };
  }, [disabled, readonly, showFilePickerFunc, placeholder]);

  const onChangeCallback = React.useCallback(
    (value: string | undefined, oldValue: string | undefined= undefined) => {
      const prev = cleanValue(oldValue);
      const v = cleanValue(value);
      wlog('on change callback', value);
      if (onChange && v !== prev) {
        const injected = toInjectorStyle(v);
        wlog('Injector style', injected);
        onChange(injected);
      }
    },
    [onChange],
  );
  /*
  const onChangeCallback2 = React.useCallback((...args: any[])=> {
    wlog('change callback 2', args);
  }, []);
*/
  const onBlurCB = React.useCallback((v: string, me: MouseEvent) => {
    wlog('blur callback', v, me);
  }, []);

  wlog('rerender J2 RECEIVED ', value);
  wlog('rerender TRANSFORMED', toFullUrl(value));

  return (
    <div className={wysiwygStyle}>
      <JoditEditor
        value={toFullUrl(value)}
        config={configRef.current}
        onChange={(s) => onChangeCallback(s)}
        onBlur={onBlurCB}
      />
    </div>
  )
}

/*
function onChangeCallback3(v: string){
  wlog('change 3', v);
};
*/
