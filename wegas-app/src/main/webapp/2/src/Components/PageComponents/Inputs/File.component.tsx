import * as React from 'react';
import {
  FileBrowser,
  FileBrowserProps,
  FileType,
  FilterType,
} from '../../../Editor/Components/FileBrowser/FileBrowser';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from './tools';

interface PlayerFileInputProps extends WegasComponentProps, FileBrowserProps {
  onVariableChange?: OnVariableChange;
  pathScript?: IScript;
  fileType: FileType;
  filterType: FilterType;
}

function PlayerFileInput({
  onVariableChange,
  context,
  pathScript,
  pickType,
  // filter,
  fileType,
  filterType,
  readOnly,
  // options,
  className,
  style,
  id,
}: PlayerFileInputProps) {
  const { handleOnChange } = useOnVariableChange(onVariableChange, context);
  const path = useScript<string>(pathScript, context);

  return (
    <FileBrowser
      defaultFilePath={path}
      noDelete
      readOnly={readOnly}
      onFileClick={file => handleOnChange && handleOnChange(file)}
      pickType={pickType}
      filter={{ fileType: fileType, filterType: filterType }}
      className={className}
      style={style}
      id={id}
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
      pathScript: schemaProps.path({
        label: 'Root path',
        pickType: 'FOLDER',
        scriptable: true,
      }),
      pickType: schemaProps.select({
        label: 'File picking option',
        values: ['FILE', 'FOLDER', 'BOTH'], // Must be exactly FileBrowser.FilePickingType // TODO see how extract it automatically
        value: 'BOTH',
      }),
      fileType: schemaProps.select({
        label: 'File filter',
        values: ['directory', 'audio', 'video', 'image'], // Must be exactly FileBrowser.FileType // TODO see how extract it automatically
      }),
      filterType: schemaProps.select({
        label: 'Filter display mode',
        values: ['show', 'hide', 'grey'], // Must be exactly FileBrowser.FilterType // TODO see how extract it automatically
        value: 'grey',
      }),
      readOnly: schemaProps.boolean({
        label: 'Read only',
        value: true,
      }),
      ...classStyleIdShema,
    },
  }),
);
