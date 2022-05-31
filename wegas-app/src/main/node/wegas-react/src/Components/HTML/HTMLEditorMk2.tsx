import * as React from 'react';
import { fileURL, generateAbsolutePath } from '../../API/files.api';
import { FileBrowser } from '../../Editor/Components/FileBrowser/FileBrowser';
import { classNameOrEmpty } from '../../Helper/className';
import { Modal } from '../Modal';
import JoditReactEditor from './JoditReactEditor';


type CallbackFN = (url: string) => void;

export interface HTMLEditorPropsMk2 extends ClassStyleId, DisabledReadonly {
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
  toolbarLayout?: "full" | "player";

}


export default function HTMLEditorMk2({
  value,
  onChange,
  className,
  style,
  id,
  placeholder,
  disabled,
  readOnly,
  toolbarLayout: toolbarLayout,
}: HTMLEditorPropsMk2) {
  const [fileBrowsing, setFileBrowsing] = React.useState<{ fn?: CallbackFN }>({});

  const onEditorChanges = React.useCallback(
    (v: string) => {
      if (value !== v && onChange) {
        onChange(v);
      }
    },
    [onChange, value],
  );

  const showFilePicker = React.useCallback((providePathCallBack: ((path: string) => void)) => {
    setFileBrowsing({fn: providePathCallBack})
  }, [])

  return (
    <div
    className={classNameOrEmpty(className)}
    style={style}
    id={id}
    >
        <JoditReactEditor
          value={value}
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
