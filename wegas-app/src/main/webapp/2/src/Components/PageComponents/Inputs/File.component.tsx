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
import { schemaProps } from '../tools/schemaProps';

interface PlayerFileInputProps extends WegasComponentProps, FileBrowserProps {
  onVariableChange?: OnVariableChange;
}

function PlayerFileInput({
  onVariableChange,
  context,
  pickType,
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
      defaultFilePath="/Patients/"
      noDelete
      //readOnly
      onFileClick={file => handleOnChange && handleOnChange(file)}
      //pickType={'FILE'}
      pickType={pickType}
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
      pickType: schemaProps.select({
        label: 'File picking option',
        values: ['FILE', 'FOLDER', 'BOTH'], //
        required: false,
      }),
      ...classStyleIdShema,
    },
  }),
);
