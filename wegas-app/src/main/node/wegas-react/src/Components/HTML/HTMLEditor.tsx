import * as React from 'react';
import { fileURL, generateAbsolutePath } from '../../API/files.api';
import { FileBrowser } from '../../Editor/Components/FileBrowser/FileBrowser';
import { classNameOrEmpty } from '../../Helper/className';
import { Modal } from '../Modal';
import JoditReactEditor from './JoditReactEditor';

type CallbackFN = (url: string) => void;

export interface HTMLEditorProps extends ClassStyleId, DisabledReadonly {
  /**
   * value - content to inject in the editor
   */
  value?: string;
  /**
   * onChange - function called each time the content of the editor changes
   */
  onChange?: (content: string) => void;
  /**
   * id - the id of the main container
   */
  id?: string;
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
   * display a custom toolbar
   */
  toolbarLayout?: 'full' | 'player';
}

export default function HTMLEditor({
  value,
  onChange,
  className,
  style,
  id,
  placeholder,
  disabled,
  readOnly,
  toolbarLayout: toolbarLayout,
}: HTMLEditorProps) {
  const [showFileBrowsing, setShowFileBrowsing] = React.useState(false);

  const fileBrowsingFunc = React.useRef<CallbackFN>(() => {});

  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const onEditorChanges = React.useCallback(
    (v: string) => {
      if (valueRef.current !== v && onChange) {
        onChange(v);
      }
    },
    [onChange, valueRef],
  );

  const showFilePicker = React.useCallback(
    (providePathCallBack: (path: string) => void) => {
      setShowFileBrowsing(true);
      fileBrowsingFunc.current = providePathCallBack;
    },
    [],
  );

  return (
    <div className={classNameOrEmpty(className)} style={style} id={id}>
      <JoditReactEditor
        value={value}
        onChange={onEditorChanges}
        placeholder={placeholder}
        disabled={disabled}
        readonly={readOnly}
        toolbarLayout={toolbarLayout}
        showFilePickerFunc={showFilePicker}
      />
      {showFileBrowsing && (
        <Modal onExit={() => setShowFileBrowsing(false)}>
          <FileBrowser
            onFileClick={file => {
              setShowFileBrowsing(false);
              file &&
                fileBrowsingFunc.current &&
                fileBrowsingFunc.current(
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
