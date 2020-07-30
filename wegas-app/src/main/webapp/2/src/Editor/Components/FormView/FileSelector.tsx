import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView, CommonViewContainer } from './commonView';
import { LabeledView, Labeled } from './labeled';
import {
  FileBrowser,
  FileFilter,
  FilePickingType,
} from '../FileBrowser/FileBrowser';
import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import { cx } from 'emotion';
import { flexRow, flex } from '../../../css/classes';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { wwarn } from '../../../Helper/wegaslog';
import { IAbstractContentDescriptor } from 'wegas-ts-api';

interface AllowedTypes {
  string: string;
  IAbstractContentDescriptor: IAbstractContentDescriptor;
}

interface CustomFileSelectProps<
  T extends keyof AllowedTypes,
  VT extends AllowedTypes[T] = AllowedTypes[T]
> extends WidgetProps.BaseProps {
  view: CommonView &
    LabeledView & { pick: FilePickingType; filter?: FileFilter };
  value?: VT;
  onChange: (code: VT) => void;
  valueType: T;
}

export function CustomFileSelector<T extends keyof AllowedTypes>(
  props: CustomFileSelectProps<T>,
) {
  const { errorMessage, view, value, onChange, valueType } = props;
  const { filter, pick = 'BOTH' } = view;

  const [currentPath, setCurrentPath] = React.useState<string | undefined>(
    value
      ? valueType === 'string'
        ? (value as string)
        : generateAbsolutePath(value as IAbstractContentDescriptor)
      : undefined,
  );
  const [showBrowser, setShowBrowser] = React.useState(false);

  return (
    <CommonViewContainer view={view} errorMessage={errorMessage}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <div className={cx(flex, flexRow)}>
              <SimpleInput
                value={currentPath}
                placeholder={
                  currentPath == null
                    ? 'Choose a file from the browser'
                    : undefined
                }
                onChange={v => {
                  setCurrentPath(String(v));
                  if (valueType === 'string') {
                    (onChange as (val: string) => void)(String(v));
                  } else {
                    FileAPI.getFileMeta(String(v))
                      .then(
                        onChange as (val: IAbstractContentDescriptor) => void,
                      )
                      .catch(wwarn);
                  }
                }}
              />
              <IconButton
                icon="folder"
                onClick={() => setShowBrowser(sb => !sb)}
                tooltip="Browse file"
              />
            </div>
            {showBrowser && (
              <FileBrowser
                id={inputId}
                filter={filter}
                selectedGlobalPaths={currentPath ? [currentPath] : undefined}
                onFileClick={file => {
                  setCurrentPath(generateAbsolutePath(file));
                  setShowBrowser(false);
                  if (valueType === 'string') {
                    (onChange as (val: string) => void)(
                      generateAbsolutePath(file),
                    );
                  } else {
                    (onChange as (val: IAbstractContentDescriptor) => void)(
                      file,
                    );
                  }
                }}
                pick={pick}
              />
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

interface FileSelectProps extends WidgetProps.BaseProps {
  view: CommonView &
    LabeledView & { pick: FilePickingType; filter?: FileFilter };
  value?: IAbstractContentDescriptor;
  onChange: (code: IAbstractContentDescriptor) => void;
}

export default function FileSelector(props: FileSelectProps) {
  return (
    <CustomFileSelector {...props} valueType="IAbstractContentDescriptor" />
  );
}
