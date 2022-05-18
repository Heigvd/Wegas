import * as React from 'react';
import {
  filterByLibraryType,
  librariesCTX,
  LibraryType,
  LibraryWithStatus,
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

  const libs = filterByLibraryType(librariesState, libraryType).reduce<Record<string, LibraryWithStatus>>((acc, current) => {
    acc[current.monacoPath] = current;
    return acc;
  }, {});

  return (
    <CustomLibraryEditorView
      libraryType={ libraryType }
      libraryIndex={ libs }
    />
  );
}
