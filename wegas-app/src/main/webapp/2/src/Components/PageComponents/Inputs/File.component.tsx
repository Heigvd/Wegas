import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import {
  FileBrowser,
  FileBrowserProps,
} from '../../../Editor/Components/FileBrowser/FileBrowser';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';

interface PlayerFileInputProps extends WegasComponentProps, FileBrowserProps {
  onVariableChange?: OnVariableChange;
}

function PlayerFileInput({
  // placeholder,
  onVariableChange,
  context,
  // pick,
  // filter,
  // options,
  className,
  style,
  id,
}: PlayerFileInputProps) {
  const { handleOnChange } = useOnVariableChange(onVariableChange, context);

  return (
    <FileBrowser
      className={className}
      style={style}
      id={id}
      onFileClick={file => handleOnChange && handleOnChange(file)}
      pick={'FILE'}
      filter={{ fileType: 'image', filterType: 'show' }}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerFileInput,
    componentType: 'Input',
    name: 'File input',
    icon: 'image',
    schema: {
      onVariableChange: onVariableChangeSchema('On file click actions'),
      ...classStyleIdShema,
    },
  }),
);
