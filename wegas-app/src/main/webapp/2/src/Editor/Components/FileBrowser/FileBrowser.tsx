import * as React from 'react';

import { css, cx } from 'emotion';
import { grow, halfOpacity, MediumPadding } from '../../../css/classes';
import { classNameOrEmpty } from '../../../Helper/className';
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
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';

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

function globalFileSelector(state: State) {
  return (
    state.global.editing &&
    state.global.editing.type === 'File' &&
    state.global.editing.entity
  );
}

export default function FileBrowserWithMeta({
  disabled,
  readOnly,
}: DisabledReadonly) {
  const globalFile = useStore(globalFileSelector);

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
            className={MediumPadding}
          />
        );
      }}
    </ComponentWithForm>
  );
}
