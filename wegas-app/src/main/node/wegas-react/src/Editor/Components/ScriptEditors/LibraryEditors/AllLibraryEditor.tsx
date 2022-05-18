import * as React from 'react';
import {
  librariesCTX,
} from '../../../../Components/Contexts/LibrariesContext';
import { CustomLibraryEditorView } from './CustomLibraryEditorView';

/**
 * LibraryEditor is a component for wegas library management
 */
export function AllLibraryEditor() {

  const { librariesState } =
    React.useContext(librariesCTX);

  return (
    <CustomLibraryEditorView
      libraryIndex={ librariesState }
    />
  );
}
