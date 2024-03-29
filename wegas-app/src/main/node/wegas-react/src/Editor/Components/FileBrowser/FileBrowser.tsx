import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IAbstractContentDescriptor } from 'wegas-ts-api';
import { FileAPI, generateAbsolutePath } from '../../../API/files.api';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { grow, halfOpacity, mediumPadding } from '../../../css/classes';
import { EditingState } from '../../../data/Reducer/editingState';
import { useEditingStore } from '../../../data/Stores/editingStore';
import { StoreDispatch } from '../../../data/Stores/store';
import { classNameOrEmpty } from '../../../Helper/className';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { mainLayoutId } from '../../layouts';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import { MessageString } from '../MessageString';
import { FileBrowserNode, FileBrowserNodeProps } from './FileBrowserNode';

const fileBrowserStyle = css({
  paddingRight: '5px',
});

export interface FileBrowserProps extends ClassStyleId, DisabledReadonly {
  defaultFilePath?: string;
  selectedLocalPaths?: string[];
  selectedGlobalPaths?: string[];
  noDelete?: boolean;
  pickOnly?: boolean;
  onFileClick?: FileBrowserNodeProps['onFileClick'];
  onDeleteFile?: FileBrowserNodeProps['onDeleteFile'];
  pickType?: FilePickingType;
  filter?: FileFilter;
  localDispatch?: StoreDispatch;
}

export function FileBrowser({
  defaultFilePath,
  selectedLocalPaths,
  selectedGlobalPaths,
  noDelete,
  pickOnly,
  onFileClick,
  onDeleteFile,
  pickType,
  filter,
  localDispatch,
  className,
  style,
  id,
  ...options
}: FileBrowserProps) {
  const [rootFile, setRootFile] = React.useState<IAbstractContentDescriptor>();
  const [error, setError] = React.useState<string>('');
  const comp = React.useRef(); // Safeguard to avoid changing state when unmounted comp
  const i18nValues = useInternalTranslate(commonTranslations);

  React.useEffect(() => {
    // Allows to cancel the state update in case the component is unmounted before promise finishes
    let run = true;
    FileAPI.getFileMeta(defaultFilePath ? defaultFilePath : undefined)
      .then(file => {
        if (run) {
          setRootFile(file);
        }
      })
      .catch(({ statusText }: Response) => {
        if (run && comp.current) {
          setRootFile(undefined);
          setError(statusText);
        }
      });
    return () => {
      run = false;
    };
  }, [defaultFilePath]);

  return rootFile ? (
    <DefaultDndProvider>
      <div
        className={
          cx(grow, {
            [halfOpacity]: options.disabled,
          }) + classNameOrEmpty(className)
        }
        style={style}
        ref={comp.current}
        id={id}
      >
        <MessageString value={error} type={'error'} duration={3000} />
        <FileBrowserNode
          item={rootFile}
          isRootNode
          selectedLocalPaths={selectedLocalPaths}
          selectedGlobalPaths={selectedGlobalPaths}
          noDelete={noDelete}
          pickOnly={pickOnly}
          onFileClick={onFileClick}
          onDeleteFile={onDeleteFile}
          pickType={pickType}
          filter={filter}
          localDispatch={localDispatch}
          className={fileBrowserStyle}
          {...options}
        />
      </div>
    </DefaultDndProvider>
  ) : (
    <div>{i18nValues.loadingFiles}</div>
  );
}

function globalFileSelector(state: EditingState) {
  return state.editing && state.editing.type === 'File' && state.editing.entity;
}

export default function FileBrowserWithMeta({
  disabled,
  readOnly,
}: DisabledReadonly) {
  const globalFile = useEditingStore(globalFileSelector);

  return (
    <ComponentWithForm disabled={disabled} readOnly={readOnly}>
      {({ localState, localDispatch }) => {
        return (
          <FileBrowser
            selectedGlobalPaths={
              globalFile ? [generateAbsolutePath(globalFile)] : []
            }
            selectedLocalPaths={
              localState && localState.type === 'File'
                ? [generateAbsolutePath(localState.entity)]
                : []
            }
            localDispatch={localDispatch}
            onFileClick={() => focusTab(mainLayoutId, 'Variable Properties')}
            disabled={disabled}
            readOnly={readOnly}
            className={mediumPadding}
          />
        );
      }}
    </ComponentWithForm>
  );
}
