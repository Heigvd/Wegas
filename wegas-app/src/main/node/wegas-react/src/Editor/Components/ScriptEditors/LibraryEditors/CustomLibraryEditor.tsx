import * as React from 'react';
import {
  librariesCTX,
  LibraryType,
} from '../../../../Components/Contexts/LibrariesContext';
import { CustomLibraryEditorView } from './CustomLibraryEditorView';

interface CustomLibraryEditorProps {
  libraryType: LibraryType;
}

/**
 * LibraryEditor is a component for wegas library management
 */
export function CustomLibraryEditor({ libraryType }: CustomLibraryEditorProps) {
  const { librariesState } =
    React.useContext(librariesCTX);

  const libs = librariesState[libraryType];

  return (
    <CustomLibraryEditorView
      libraryType={ libraryType }
      libraryIndex={ libs }
    />
  );
}
