import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import { FileFilter, FilePickingType } from '../FileBrowser/FileBrowser';
import {
  CommonFileSelectProps,
  LabeledCustomFileSelector,
} from './FileSelector';

type PathSelectProps = WidgetProps.BaseProps<
  CommonView & LabeledView & { pick?: FilePickingType; filter?: FileFilter }
> &
  Omit<CommonFileSelectProps<'string'>, 'valueType'>;

export default function PathSelector(props: PathSelectProps) {
  return <LabeledCustomFileSelector {...props} valueType="string" />;
}
