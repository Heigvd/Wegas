import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView, CommonViewContainer } from './commonView';
import { LabeledView, Labeled } from './labeled';
import {
  FileBrowser,
  FileFilter,
  FilePickingType,
} from '../FileBrowser/FileBrowser';
import { generateAbsolutePath } from '../../../API/files.api';

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView &
    LabeledView & { pick: FilePickingType; filter?: FileFilter };
  value?: IAbstractContentDescriptor;
  onChange: (code: IAbstractContentDescriptor) => void;
}

export default function FileSelector(props: PageSelectProps) {
  const { errorMessage, view, value, onChange } = props;
  return (
    <CommonViewContainer view={view} errorMessage={errorMessage}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <FileBrowser
              id={inputId}
              filter={view.filter}
              selectedGlobalPaths={
                value ? [generateAbsolutePath(value)] : undefined
              }
              onFileClick={onChange}
              pick={view.pick}
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
