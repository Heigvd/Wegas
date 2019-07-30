type TinyMCEEditorEventType =
  | 'click'
  | 'dblclick'
  | 'mousedown'
  | 'mouseup'
  | 'mousemove'
  | 'mouseover'
  | 'mouseout'
  | 'mouseenter'
  | 'mouseleave'
  | 'keydown'
  | 'keypress'
  | 'keyup'
  | 'contextmenu'
  | 'paste'
  | 'init'
  | 'focus'
  | 'blur'
  | 'beforesetcontent'
  | 'setcontent'
  | 'getcontent'
  | 'preprocess'
  | 'postprocess'
  | 'undo'
  | 'redo'
  | 'change'
  | 'dirty'
  | 'remove'
  | 'execcommand'
  | 'pastepreprocess'
  | 'pastepostprocess';

type TinyMCEIcons =
  | 'accessibility-check'
  | 'align-center'
  | 'align-justify'
  | 'align-left'
  | 'align-none'
  | 'align-right'
  | 'arrow-left'
  | 'arrow-right'
  | 'bold'
  | 'bookmark'
  | 'border-width'
  | 'brightness'
  | 'browse'
  | 'cancel'
  | 'change-case'
  | 'character-count'
  | 'checklist-rtl'
  | 'checklist'
  | 'checkmark'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'close'
  | 'code-sample'
  | 'color-levels'
  | 'color-picker'
  | 'color-swatch-remove-color'
  | 'color-swatch'
  | 'comment-add'
  | 'comment'
  | 'contrast'
  | 'copy'
  | 'crop'
  | 'cut'
  | 'document-properties'
  | 'drag'
  | 'duplicate'
  | 'edit-block'
  | 'edit-image'
  | 'embed-page'
  | 'embed'
  | 'emoji'
  | 'fill'
  | 'flip-horizontally'
  | 'flip-vertically'
  | 'format-painter'
  | 'fullscreen'
  | 'gallery'
  | 'gamma'
  | 'help'
  | 'highlight-bg-color'
  | 'home'
  | 'horizontal-rule'
  | 'image-options'
  | 'image'
  | 'indent'
  | 'info'
  | 'insert-character'
  | 'insert-time'
  | 'invert'
  | 'italic'
  | 'line'
  | 'link'
  | 'list-bull-circle'
  | 'list-bull-default'
  | 'list-bull-square'
  | 'list-num-default-rtl'
  | 'list-num-default'
  | 'list-num-lower-alpha-rtl'
  | 'list-num-lower-alpha'
  | 'list-num-lower-greek-rtl'
  | 'list-num-lower-greek'
  | 'list-num-lower-roman-rtl'
  | 'list-num-lower-roman'
  | 'list-num-upper-alpha-rtl'
  | 'list-num-upper-alpha'
  | 'list-num-upper-roman-rtl'
  | 'list-num-upper-roman'
  | 'lock'
  | 'ltr'
  | 'more-drawer'
  | 'new-document'
  | 'new-tab'
  | 'nodechange'
  | 'non-breaking'
  | 'notice'
  | 'ordered-list-rtl'
  | 'ordered-list'
  | 'orientation'
  | 'outdent'
  | 'page-break'
  | 'paragraph'
  | 'paste-text'
  | 'paste'
  | 'permanent-pen'
  | 'plus'
  | 'preferences'
  | 'preview'
  | 'print'
  | 'quote'
  | 'redo'
  | 'reload'
  | 'remove-formatting'
  | 'remove'
  | 'resize-handle'
  | 'resize'
  | 'restore-draft'
  | 'rotate-left'
  | 'rotate-right'
  | 'rtl'
  | 'save'
  | 'search'
  | 'select-all'
  | 'selected'
  | 'settings'
  | 'sharpen'
  | 'sourcecode'
  | 'spell-check'
  | 'strike-through'
  | 'subscript'
  | 'superscript'
  | 'table-cell-properties'
  | 'table-cell-select-all'
  | 'table-cell-select-inner'
  | 'table-delete-column'
  | 'table-delete-row'
  | 'table-delete-table'
  | 'table-insert-column-after'
  | 'table-insert-column-before'
  | 'table-insert-row-above'
  | 'table-insert-row-after'
  | 'table-left-header'
  | 'table-merge-cells'
  | 'table-row-properties'
  | 'table-split-cells'
  | 'table-top-header'
  | 'table'
  | 'template'
  | 'temporary-placeholder'
  | 'text-color'
  | 'toc'
  | 'translate'
  | 'underline'
  | 'undo'
  | 'unlink'
  | 'unlock'
  | 'unordered-list'
  | 'unselected'
  | 'upload'
  | 'user'
  | 'warning'
  | 'zoom-in'
  | 'zoom-out';

interface TinyMCEEvent {
  isDefaultPrevented: () => boolean;
  isImmediatePropagationStopped: () => boolean;
  isPropagationStopped: () => boolean;
  preventDefault: () => void;
  stopImmediatePropagation: () => void;
  stopPropagation: () => void;
  target: TinyMCEEditor;
  type: TinyMCEEditorEventType;
}

interface TinyMCENodeChangeEvent {
  element: HTMLElement;
  parents: HTMLElement[];
}

interface TinyMCEEventCallbacks {
  init: TinyMCEEvent;
  nodechange: TinyMCENodeChangeEvent;
}

interface TinyMCEEditorFormatter {
  toggle: (style_format_name: string) => void;
}

interface TinyMCEToggleButtonAPI {
  isDisabled: () => boolean;
  setDisabled: (state: boolean) => void;
  isActive: () => boolean;
  setActive: (state: boolean) => void;
}

interface TinyMCEEditor {
  on: <T extends keyof TinyMCEEventCallbacks>(
    event: T,
    callback: (event?: TinyMCEEventCallbacks[T]) => void,
  ) => void;
  off: <T extends keyof TinyMCEEventCallbacks>(
    event: T,
    callback: (event?: TinyMCEEventCallbacks[T]) => void,
  ) => void;
  formatter?: TinyMCEEditorFormatter;
  ui: {
    registry: {
      addToggleButton: (
        name: string,
        specs: {
          text?: string;
          icon?: TinyMCEIcons;
          tooltip?: string;
          disabled?: boolean;
          active?: boolean;
          onSetup?: (
            api: TinyMCEToggleButtonAPI,
          ) => (api: TinyMCEToggleButtonAPI) => void;
          onAction: (api: TinyMCEToggleButtonAPI) => void;
        },
      ) => void;
    };
  };
}
