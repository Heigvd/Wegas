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

interface PathSelectProps extends WidgetProps.BaseProps {
  view: CommonView &
    LabeledView & { pick: FilePickingType; filter?: FileFilter };
  value?: string;
  onChange: (code: string) => void;
}

export default function PathSelector(props: PathSelectProps) {
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
              selectedGlobalPaths={value ? [value] : undefined}
              onFileClick={file => onChange(generateAbsolutePath(file))}
              pick={view.pick}
            />
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
