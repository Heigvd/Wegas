import * as React from 'react';
import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { FileBrowserNode, FileBrowserNodeProps } from './FileBrowserNode';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { StoreDispatch, useStore } from '../../../data/store';
import { grow } from '../../../css/classes';
import { MessageString } from '../MessageString';
import { css } from 'emotion';
import { mainLayoutId } from '../Layout';
import { IAbstractContentDescriptor } from 'wegas-ts-api';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import { classNameOrEmpty } from '../../../Helper/className';
import { State } from '../../../data/Reducer/reducers';
// import { themeVar } from '../../../Components/Style/ThemeVars';

const fileBrowserStyle = css({
  // backgroundColor: themeVar.Common.colors.HeaderColor,
  paddingRight: '5px',
  // borderColor: themeVar.Common.colors.BorderColor,
  // borderRadius: themeVar.Common.dimensions.BorderRadius,
  // borderWidth: '2px',
  // borderStyle: 'inset',
});

export type FilePickingType = 'FILE' | 'FOLDER' | 'BOTH' | undefined;
export type FileType = 'directory' | 'audio' | 'video' | 'image';
export type FilterType = 'show' | 'hide' | 'grey';
export interface FileFilter {
  filterType: FilterType;
  fileType: FileType;
}

export interface FileBrowserProps extends ClassStyleId {
  defaultFilePath?: string;
  noDelete?: boolean;
  readOnly?: boolean;
  onFileClick?: FileBrowserNodeProps['onFileClick'];
  onDelelteFile?: FileBrowserNodeProps['onDelelteFile'];
  selectedLocalPaths?: string[];
  selectedGlobalPaths?: string[];
  localDispatch?: StoreDispatch;
  pick?: FilePickingType;
  filter?: FileFilter;
}

export function FileBrowser({
  defaultFilePath,
  noDelete,
  readOnly,
  onFileClick,
  onDelelteFile,
  selectedLocalPaths,
  selectedGlobalPaths,
  localDispatch,
  pick,
  filter,
  className,
  style,
  id,
}: FileBrowserProps) {
  const [rootFile, setRootFile] = React.useState<IAbstractContentDescriptor>();
  const [error, setError] = React.useState<string>('');
  const comp = React.useRef(); // Safeguard to avoid changing state when unmounted comp

  React.useEffect(() => {
    FileAPI.getFileMeta(defaultFilePath ? defaultFilePath : undefined)
      .then(file => setRootFile(file))
      .catch(({ statusText }: Response) => {
        if (comp.current) {
          setRootFile(undefined);
          setError(statusText);
        }
      });
  }, [defaultFilePath]);

  return rootFile ? (
    <DefaultDndProvider>
      <div
        className={grow + classNameOrEmpty(className)}
        style={style}
        ref={comp.current}
        id={id}
      >
        <MessageString value={error} type={'error'} duration={3000} />
        <FileBrowserNode
          defaultFile={rootFile}
          selectedLocalPaths={selectedLocalPaths}
          selectedGlobalPaths={selectedGlobalPaths}
          noBracket
          noDelete={noDelete}
          readOnly={readOnly}
          onFileClick={onFileClick}
          onDelelteFile={onDelelteFile}
          localDispatch={localDispatch}
          pick={pick}
          filter={filter}
          className={fileBrowserStyle}
        />
      </div>
    </DefaultDndProvider>
  ) : (
    <div>"Loading files"</div>
  );
}

function globalFileSelector(state: State) {
  return (
    state.global.editing &&
    state.global.editing.type === 'File' &&
    state.global.editing.entity
  );
}

export default function FileBrowserWithMeta() {
  const globalFile = useStore(globalFileSelector);

  return (
    <ComponentWithForm>
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
          />
        );
      }}
    </ComponentWithForm>
  );
}
