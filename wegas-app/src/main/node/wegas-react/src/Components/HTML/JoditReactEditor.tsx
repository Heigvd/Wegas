import React from 'react';
import { css } from '@emotion/css';
import { themeVar } from '../Theme/ThemeVars';
import { Config } from 'jodit/types/config';
import { ButtonsGroups, DeepPartial } from 'jodit/types/types';
import { Jodit } from 'jodit';
import sanitize, { toFullUrl, toInjectorStyle } from '../../Helper/sanitize';
import JoditEditor from 'jodit-react';
import { classesCTX } from '../Contexts/ClassesProvider';
import { useDebounceFn } from '../Hooks/useDebounce';

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

function getButtonConfig(layout: 'full' | 'player' | undefined, extended: boolean): ButtonsGroups {
  switch (layout) {
    case 'full':
      return extended ? [
        'bold',
        'italic',
        'underline',
        '|',
        'customAlignment',
        'ul',
        'ol',
        '|',
        'link',
        IMG_PLACEHOLDER,
        SRC_PLACEHOLDER,
        'table',
        '|',
        'paragraph',
        'fontsize',
        'brush',
        'classSpan', // custom fonts
      ] : [
        'bold',
        'italic',
        'underline',
        '|',
        'ul',
        'ol',
        '|',
        'link',
        IMG_PLACEHOLDER,
        SRC_PLACEHOLDER,
        '|',
        'fontsize',
        '|',
        'collapsedTools',
      ];
    case 'player':
    default:
      return [
        'bold',
        'italic',
        'underline',
        '|',
        'ul',
        'ol',
        '|',
        'paragraph',
        'fontsize',
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
      tooltip: 'HTML',
      exec: function (editor: Jodit) {
        editor.setMode(editor.getMode() === WYSIWYG ? SPLIT : WYSIWYG);
      },
    };
  }
}

/***************** REACT COMPONENT ***************/
export default function JoditReactEditor({
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
    const btnConfigExtended = getButtonConfig(toolbarLayout, true);
    const btnConfig = getButtonConfig(toolbarLayout, false);
    const collapsedList : Record<string, string> = {
      left: 'left',
      center : 'center',
      right : 'right',
      justify: 'justify',
      table: 'table',
      paragraph: 'paragraph',
      brush: 'brush',
    }

    addCustomFunctions(btnConfigExtended, showFilePickerFunc);
    addCustomFunctions(btnConfig, showFilePickerFunc);
    const config: DeepPartial<Config> =  {
      defaultActionOnPaste : 'insert_only_text',
      askBeforePasteFromWord : false,
      askBeforePasteHTML : false,
      statusbar: false,
      disablePlugins : disabledPlugins,
      buttons: btnConfigExtended,
      buttonsMD: btnConfigExtended,
      buttonsSM: btnConfig,
      buttonsXS: btnConfig,
      sizeSM : 265,
      sizeMD : 530,
      readonly: readonly,
      disabled: disabled,
      placeholder: placeholder || '',
      showTooltip: false,
      toolbarAdaptive: true,
      toolbarButtonSize: 'small',
      controls: {
        customAlignment: {
          icon: 'left',
          tooltip: 'Alignment',
          list: {
            left: 'left',
            center : 'center',
            right : 'right',
            justify: 'justify',
          },
        },
        collapsedTools: {
          icon: 'dots',
          tooltip: 'Other tools',
          list: collapsedList,
        },
        classSpan: { }
      }
    };

    if (Object.keys(classes).length && config.controls?.classSpan) {
      config.controls.classSpan.list = classes;
      collapsedList.classSpan = 'classSpan';
    } else {
      config.removeButtons = ['classSpan'];
    }

    return config;

  }, [disabled, readonly, showFilePickerFunc, placeholder, classes]);


  const onChangeCallback = React.useCallback(
    useDebounceFn((value: string) => {
      const v = sanitize(value.replace(/\n/g, ''));
      if (onChange) {
        const injected = toInjectorStyle(v);
        onChange(injected);
      }
    }, 1000),
    [onChange],
  );
  // force resize on jodit editor when its size changes
  const sizeChangeListener = React.useCallback((editor: Jodit) => {
    const container = editor.container;
    const ro = new ResizeObserver(() => debouncedResize(editor));
    ro.observe(container);
  }, []);

  const debouncedResize = useDebounceFn((editor: Jodit) => {
    editor.events.fire('resize');
  }, 100);

  return (
      <div className={wysiwygStyle}>
        <JoditEditor
            value={toFullUrl(value)}
            config={configuration}
            onChange={(s) => onChangeCallback(s)}
            editorRef={sizeChangeListener}
        />
      </div>
  )
}
