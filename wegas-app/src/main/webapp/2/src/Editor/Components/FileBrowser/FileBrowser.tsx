import * as React from 'react';

import { css, cx } from 'emotion';
import { grow, halfOpacity } from '../../../css/classes';
import { classNameOrEmpty } from '../../../Helper/className';
// import { themeVar } from '../../../Components/Style/ThemeVars';

import { IAbstractContentDescriptor } from 'wegas-ts-api';

import { StoreDispatch, useStore } from '../../../data/Stores/store';
import { State } from '../../../data/Reducer/reducers';

import { mainLayoutId } from '../Layout';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { MessageString } from '../MessageString';

import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { FileBrowserNode, FileBrowserNodeProps } from './FileBrowserNode';

const fileBrowserStyle = css({
  paddingRight: '5px',
});

export type FilePickingType = 'FILE' | 'FOLDER' | 'BOTH' | undefined;
export type FileType = 'directory' | 'audio' | 'video' | 'image';
export type FilterType = 'show' | 'hide' | 'grey';
export interface FileFilter {
  filterType: FilterType;
  fileType: FileType;
}

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
    <div>Loading files</div>
  );
}

function globalFileSelector(state: State) {
  return (
    state.global.editing &&
    state.global.editing.type === 'File' &&
    state.global.editing.entity
  );
}

export default function FileBrowserWithMeta(options: DisabledReadonlyLocked) {
  const globalFile = useStore(globalFileSelector);

  return (
    <ComponentWithForm {...options}>
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
            {...options}
          />
        );
      }}
    </ComponentWithForm>
  );
}
