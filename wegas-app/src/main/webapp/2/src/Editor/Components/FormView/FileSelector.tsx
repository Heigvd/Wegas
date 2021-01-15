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
import { wwarn } from '../../../Helper/wegaslog';
import { IAbstractContentDescriptor } from 'wegas-ts-api';
import { Button } from '../../../Components/Inputs/Buttons/Button';

interface AllowedTypes {
  string: string;
  IAbstractContentDescriptor: IAbstractContentDescriptor;
}

export interface CommonFileSelectProps<
  T extends keyof AllowedTypes,
  VT extends AllowedTypes[T] = AllowedTypes[T]
> {
  value?: VT;
  onChange: (code: VT) => void;
  valueType: T;
}

interface CustomFileSelectProps<T extends keyof AllowedTypes>
  extends CommonFileSelectProps<T> {
  pickType?: FilePickingType;
  filter?: FileFilter;
  inputId?: string;
  labelNode?: JSX.Element;
}

export function CustomFileSelector<T extends keyof AllowedTypes>({
  value,
  onChange,
  valueType,
  filter,
  pickType = 'BOTH',
  inputId,
  labelNode,
}: CustomFileSelectProps<T>) {
  const [currentPath, setCurrentPath] = React.useState<string | undefined>(
    value
      ? valueType === 'string'
        ? (value as string)
        : generateAbsolutePath(value as IAbstractContentDescriptor)
      : undefined,
  );
  const [showBrowser, setShowBrowser] = React.useState(false);

  return (
    <>
      {labelNode}
      <div className={cx(flex, flexRow)}>
        <SimpleInput
          value={currentPath}
          placeholder={
            currentPath == null ? 'Choose a file from the browser' : undefined
          }
          onChange={v => {
            setCurrentPath(String(v));
            if (valueType === 'string') {
              (onChange as (val: string) => void)(String(v));
            } else {
              FileAPI.getFileMeta(String(v))
                .then(onChange as (val: IAbstractContentDescriptor) => void)
                .catch(wwarn);
            }
          }}
        />
        <Button
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
              (onChange as (val: string) => void)(generateAbsolutePath(file));
            } else {
              (onChange as (val: IAbstractContentDescriptor) => void)(file);
            }
          }}
          pickType={pickType}
        />
      )}
    </>
  );
}

type LabeledCustomFileSelectProps<
  T extends keyof AllowedTypes
> = WidgetProps.BaseProps<
  CommonView & LabeledView & { pickType?: FilePickingType; filter?: FileFilter }
> &
  CommonFileSelectProps<T>;

export function LabeledCustomFileSelector<T extends keyof AllowedTypes>(
  props: LabeledCustomFileSelectProps<T>,
) {
  const { errorMessage, view } = props;

  return (
    <CommonViewContainer view={view} errorMessage={errorMessage}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <CustomFileSelector
            {...props}
            {...view}
            inputId={inputId}
            labelNode={labelNode}
          />
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

type FileSelectProps = WidgetProps.BaseProps<
  CommonView & LabeledView & { pickType: FilePickingType; filter?: FileFilter }
> &
  CommonFileSelectProps<'IAbstractContentDescriptor'>;

export default function FileSelector(props: FileSelectProps) {
  return (
    <LabeledCustomFileSelector
      {...props}
      valueType="IAbstractContentDescriptor"
    />
  );
}
