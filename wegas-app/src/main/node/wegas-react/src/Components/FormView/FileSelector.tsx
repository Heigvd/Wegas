import { cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { IAbstractContentDescriptor } from 'wegas-ts-api';
import { FileAPI, generateAbsolutePath } from '../../API/files.api';
import { flex, flexRow } from '../../css/classes';
import { FileBrowser } from '../../Editor/Components/FileBrowser/FileBrowser';
import { wwarn } from '../../Helper/wegaslog';
import { Button } from '../Inputs/Buttons/Button';
import { SimpleInput } from '../Inputs/SimpleInput';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

interface AllowedTypes {
  string: string;
  IAbstractContentDescriptor: IAbstractContentDescriptor;
}

export interface CommonFileSelectProps<
  T extends keyof AllowedTypes,
  VT extends AllowedTypes[T] = AllowedTypes[T],
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

type LabeledCustomFileSelectProps<T extends keyof AllowedTypes> =
  WidgetProps.BaseProps<
    CommonView &
      LabeledView & { pickType?: FilePickingType; filter?: FileFilter }
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
