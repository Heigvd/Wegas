import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import { FileFilter, FilePickingType } from '../FileBrowser/FileBrowser';
import { CustomFileSelector } from './FileSelector';

interface PathSelectProps extends WidgetProps.BaseProps {
  view: CommonView &
    LabeledView & { pick: FilePickingType; filter?: FileFilter };
  value?: string;
  onChange: (code: string) => void;
}

export default function PathSelector(props: PathSelectProps) {
  return <CustomFileSelector {...props} valueType="string" />;
}
