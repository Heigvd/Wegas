import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../Components/SizedDiv';
import * as monaco from 'monaco-editor';
import * as t from '../../page-schema.build';

interface DiffEditorProps {
  originalContent: string;
  modifiedContent: string;
  uri?: 'internal://page.json';
  // readonly?: boolean;
  // minimap: boolean;
  language: 'javascript' | 'css' | 'json';
  setDiffNavigator: (navigator: monaco.editor.IDiffNavigator) => void;
  // onChange: (value: string) => void;
  // onBlur: (value: string) => void;
}

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

export function DiffEditor(props: DiffEditorProps) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>();

  const refContainer = (n: HTMLDivElement | null) => {
    setContainer(n);
  };

  let editor: monaco.editor.IStandaloneDiffEditor;
  let diffNavigator: monaco.editor.IDiffNavigator;

  const setUpContentModels = () => {
    if (editor) {
      // Setting up model from original and modified content
      const originalModel = monaco.editor.createModel(
        props.originalContent,
        props.language,
        props.uri ? monaco.Uri.parse(props.uri) : undefined,
      );
      const modifiedModel = monaco.editor.createModel(
        props.modifiedContent,
        props.language,
        props.uri ? monaco.Uri.parse(props.uri) : undefined,
      );

      editor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });

      editor.layout();
    }
  };

  React.useEffect(() => {
    console.log('refresh diff : ', container);
    if (container) {
      // Setting validation/autocompletion
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            fileMatch: ['page.json'],
            uri: 'internal://page-schema.json',
            schema: (t as any).schema,
          },
        ],
      });

      // Setting up diff editor
      editor = monaco.editor.createDiffEditor(container);

      // Adding a diff navigator
      diffNavigator = monaco.editor.createDiffNavigator(editor, {
        followsCaret: true, // resets the navigator state when the user selects something in the editor
        ignoreCharChanges: true, // jump from line to line
      });

      props.setDiffNavigator(diffNavigator);

      setUpContentModels();
    }
  }, [container]);

  React.useEffect(() => {
    setUpContentModels();
  }, [props.originalContent]);

  return (
    <SizedDiv className={overflowHide}>
      {size => {
        if (size !== undefined && editor !== undefined) {
          editor.layout(size);
        }
        console.log('Diff rendering');
        return (
          <div
            key={props.originalContent} // ugly workaround to rerender div when content change. A better solution have to be found
            className={overflowHide}
            ref={refContainer}
          />
        );
      }}
    </SizedDiv>
  );
}
