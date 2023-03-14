import * as React from 'react';
import {
  FileBrowser,
  FileBrowserProps,
} from '../../../Editor/Components/FileBrowser/FileBrowser';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
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
  fileType,
  filterType,
  pickOnly,
  className,
  style,
  id,
  options,
}: PlayerFileInputProps) {
  const { handleOnChange } = useOnVariableChange(onVariableChange, context);
  const path = useScript<string>(pathScript, context);

  return (
    <FileBrowser
      defaultFilePath={path}
      noDelete
      pickOnly={pickOnly}
      onFileClick={file => handleOnChange && handleOnChange(file)}
      pickType={pickType}
      filter={{ fileType: fileType, filterType: filterType }}
      className={className}
      style={style}
      id={id}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerFileInput,
    componentType: 'Input',
    id: 'File input',
    name: 'File input',
    icon: 'image',
    illustration: 'fileInput',
    schema: {
      onVariableChange: onVariableChangeSchema('On file click actions'),
      pathScript: schemaProps.scriptPath({
        label: 'Root path',
        pickType: 'FOLDER',
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
      pickOnly: schemaProps.boolean({
        label: 'Pick only',
        value: true,
      }),
      ...classStyleIdSchema,
    },
    obsoleteComponent: {
      keepDisplayingToPlayer: true,
      isObsolete: oldComponent => 'readOnly' in oldComponent.props,
      sanitizer: oldComponent => {
        const newComponent = { ...oldComponent };
        newComponent.props.pickOnly = newComponent.props.readOnly;
        delete newComponent.props.readOnly;
        return newComponent;
      },
    },
  }),
);
