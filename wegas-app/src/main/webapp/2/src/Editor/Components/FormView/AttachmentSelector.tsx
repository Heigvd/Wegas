import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import { FileFilter, FilePickingType } from '../FileBrowser/FileBrowser';
import translatable from './translatable';
import PathSelector from './PathSelector';
import {
  IAttachment,
  ITranslatableContent,
} from 'wegas-ts-api';

interface AttachmentSelectProps extends WidgetProps.BaseProps {
  view: CommonView &
    LabeledView & { pick: FilePickingType; filter?: FileFilter };
  value?: IAttachment;
  onChange: (code: IAttachment) => void;
}

export default function AttachmentSelector({
  value,
  onChange,
  ...props
}: AttachmentSelectProps) {
  const onAttachementChange = React.useCallback(
    (value: ITranslatableContent) =>
      onChange({
        '@class': 'Attachment',
        file: value,
      }),
    [onChange],
  );

  return translatable(PathSelector)({
    ...props,
    value: value?.file,
    onChange: onAttachementChange,
  });
}
