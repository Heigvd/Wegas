import * as React from 'react';
import { useTempModel } from '../../Components/Contexts/LibrariesContext';
import MergeEditor from '../../Editor/Components/ScriptEditors/MergeEditor';

const originalContent =
  "const salut = '123';\nconst yomama = salut;\nconst yoloo = 123;";

export default function MergeEditorTester() {
  const modifiedModel = useTempModel(
    'const salut = 1;\nconst yomama = salut;\nlet youhou = yomama;',
    'typescript',
  );

  return modifiedModel != null ? (
    <MergeEditor
      modifiedFileName={modifiedModel.uri.toString()}
      originalContent={originalContent}
      onResolved={alert}
    />
  ) : (
    <div>'No model'</div>
  );
}
