import { useMonaco } from '@monaco-editor/react';
import * as React from 'react';
import {
  LibraryType,
  LibraryWithStatus,
} from '../../../../Components/Contexts/LibrariesContext';
import { MonacoEditor } from '../editorHelpers';
import { CustomLibraryEditorView } from './CustomLibraryEditorView';

interface AllLibraryEditorProps {
  libraryType: LibraryType;
}

function getAllModels(reactMonaco: MonacoEditor): LibraryWithStatus[] {
  return reactMonaco.editor.getModels().map(model => {
    const x: LibraryWithStatus = {
      monacoPath: model.uri.toString(),
      persisted: {
        "@class": "GameModelContent",
        content: '',
        contentType: '',
        version: 0,
      },
      libraryType: 'client',
      conflict: false,
      modified: false,
      readOnly: true,
      visibility: 'PRIVATE',
    };
    return x;
  });
}

/**
 * LibraryEditor is a component for wegas library management
 */
export function AllLibraryEditor({ libraryType }: AllLibraryEditorProps) {

  const libs: Record<string, LibraryWithStatus> = {};
  const monaco = useMonaco();
  if (monaco) {
    getAllModels(monaco).forEach(lib => {
      libs[lib.monacoPath] = lib;
    });
  }


  return (
    <CustomLibraryEditorView
      libraryType={ libraryType }
      libraryIndex={ libs }
    />
  );
}
