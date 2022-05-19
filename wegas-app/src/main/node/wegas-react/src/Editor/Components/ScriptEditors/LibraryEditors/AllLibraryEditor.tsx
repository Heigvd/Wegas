import * as React from 'react';
import {
  librariesCTX, libraryTypeToFormat, LibraryWithStatus,
} from '../../../../Components/Contexts/LibrariesContext';
import { CustomLibraryEditorView } from './CustomLibraryEditorView';

/**
 * LibraryEditor is a component for wegas library management
 */
export function AllLibraryEditor() {

  const { librariesState } =
    React.useContext(librariesCTX)

      // label: `${ value.libraryType }/${ value.label }`
  const index = Object.entries(librariesState).reduce<Record<string, LibraryWithStatus>>((acc, [key, value]) => {
    acc[key] = {
      ...value,
      label: `${ value.libraryType }/${ value.label }.${ libraryTypeToFormat(value.libraryType)}`
    }
    return acc;
  }, {});
  return (
    <CustomLibraryEditorView
      libraryIndex={ index }
    />
  );
}
