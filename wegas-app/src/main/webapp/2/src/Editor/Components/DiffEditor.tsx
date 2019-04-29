import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../Components/SizedDiv';
import * as monaco from 'monaco-editor';
import * as t from '../../page-schema.build';
import { Toolbar } from '../../Components/Toolbar';
import { IconButton } from '../../Components/Button/IconButton';

interface DiffEditorProps {
  originalContent: string;
  modifiedContent: string;
  uri?: 'internal://page.json';
  language: 'javascript' | 'css' | 'json';
  onResolved: (newContent: string) => void;
}

interface ExtendedDiffNavigator extends monaco.editor.IDiffNavigator {
  nextIdx: number;
  ranges: [
    {
      endColumn: number;
      endLineNumber: number;
      startColumn: number;
      startLineNumber: number;
    }
  ];
}

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

export function DiffEditor(props: DiffEditorProps) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>();
  const [diffNavigator, setDiffNavigator] = React.useState<
    ExtendedDiffNavigator
  >();
  const [idx, setIdx] = React.useState<number>(0);
  const [diffEditor, setDiffEditor] = React.useState<
    monaco.editor.IStandaloneDiffEditor
  >();
  const [content, setContent] = React.useState<{
    original: string;
    modified: string;
  }>({ original: props.originalContent, modified: props.modifiedContent });

  const setUpContentModels = () => {
    if (diffEditor) {
      // Setting up model from original and modified content
      const originalModel = monaco.editor.createModel(
        content.original,
        props.language,
        props.uri ? monaco.Uri.parse(props.uri) : undefined,
      );
      const modifiedModel = monaco.editor.createModel(
        content.modified,
        props.language,
        props.uri ? monaco.Uri.parse(props.uri) : undefined,
      );

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });

      diffEditor.layout();
    }
  };

  React.useEffect(() => {
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
      setDiffEditor(() => {
        const editor = monaco.editor.createDiffEditor(container);
        editor.onDidUpdateDiff(() => {
          if (editor) {
            const changes = editor.getLineChanges();
            if (changes && changes.length === 0) {
              setIdx(-1);
            }
          }
        });
        return editor;
      });
    }
  }, [container]);

  React.useEffect(() => {
    if (diffEditor) {
      // Adding a diff navigator
      setDiffNavigator(() => {
        const navigator = monaco.editor.createDiffNavigator(diffEditor, {
          followsCaret: true, // resets the navigator state when the user selects something in the editor
          ignoreCharChanges: true, // jump from line to line
        }) as ExtendedDiffNavigator;
        return navigator;
      });

      setUpContentModels();
    }
  }, [diffEditor]);

  React.useEffect(() => {
    setContent(content => {
      return {
        ...content,
        original: props.originalContent,
      };
    });
  }, [props.originalContent]);

  React.useEffect(() => {
    setUpContentModels();
  }, [content]);

  const textToArray = (text: string): string[] => {
    return text.split('\n');
  };

  const arrayToText = (splittedText: string[]): string => {
    const length = splittedText.length;
    let text = '';
    for (let i = 0; i < length; ++i) {
      text += splittedText[i] + (i !== length - 1 ? '\n' : '');
    }
    return text;
  };

  const getTextLines = (
    text: string,
    start: number,
    end: number,
  ): string | null => {
    if (end < start) {
      return null;
    }
    const splittedText = textToArray(text);
    let lines = '';
    for (let i = start; i <= end && i > 0 && i < splittedText.length; i += 1) {
      lines += splittedText[i] + '\n';
    }
    return lines;
  };

  const replaceContent = (
    text: string,
    line: string | null, // If null, remove line
    position: number,
  ): string => {
    let splittedText = textToArray(text);
    if (line === null) {
      splittedText.splice(position, 1);
    } else {
      splittedText[position] = line.replace(new RegExp('\n$'), '');
    }
    return arrayToText(splittedText);
  };

  const insertContent = (
    text: string,
    line: string | null,
    position: number,
  ): string => {
    if (line !== null) {
      let splittedText = textToArray(text);
      splittedText.splice(position, 0, line.replace(new RegExp('\n$'), ''));
      return arrayToText(splittedText);
    }
    return text;
  };

  interface DiffEditorLineChanges {
    modifiedEndLineNumber: number;
    modifiedStartLineNumber: number;
    originalEndLineNumber: number;
    originalStartLineNumber: number;
  }

  const onNavigator = (next: boolean) => {
    if (diffNavigator) {
      if (next) {
        diffNavigator.next();
      } else {
        diffNavigator.previous();
      }
      setIdx(diffNavigator.nextIdx);
    }
  };

  const onKeepOne = (original: boolean) => {
    if (diffEditor && diffNavigator) {
      const changes = diffEditor.getLineChanges() as DiffEditorLineChanges[];
      if (idx >= 0) {
        setContent(content => {
          const change = changes[idx];
          const newContent = original ? content.original : content.modified;
          const oldContent = original ? content.modified : content.original;
          const newStartLine = original
            ? change.originalStartLineNumber
            : change.modifiedStartLineNumber;
          const newEndLine = original
            ? change.originalEndLineNumber
            : change.modifiedEndLineNumber;
          const oldStartLine = original
            ? change.modifiedStartLineNumber
            : change.originalStartLineNumber;
          const oldEndLine = original
            ? change.modifiedEndLineNumber
            : change.originalEndLineNumber;

          const newText = getTextLines(
            newContent,
            newStartLine - 1,
            newEndLine - 1,
          );
          if (original) {
            return {
              ...content,
              modified:
                oldEndLine > 0 // Checks if line is missing
                  ? replaceContent(oldContent, newText, oldStartLine - 1)
                  : insertContent(oldContent, newText, oldStartLine),
            };
          } else {
            return {
              ...content,
              original:
                oldEndLine > 0 // Checks if line is missing
                  ? replaceContent(oldContent, newText, oldStartLine - 1)
                  : insertContent(oldContent, newText, oldStartLine),
            };
          }
        });
      }
    }
  };

  const onKeepAll = () => {
    if (diffEditor && diffNavigator) {
      const changes = diffEditor.getLineChanges() as DiffEditorLineChanges[];
      const idx = diffNavigator.nextIdx;
      if (idx >= 0) {
        setContent(content => {
          const change = changes[idx];
          const origText = getTextLines(
            content.original,
            change.originalStartLineNumber - 1,
            change.originalEndLineNumber - 1,
          );
          const modifText = getTextLines(
            content.modified,
            change.modifiedStartLineNumber - 1,
            change.modifiedEndLineNumber - 1,
          );
          const newText =
            (origText ? origText : '') + (modifText ? modifText : '');
          return {
            original: replaceContent(
              content.original,
              newText,
              change.originalStartLineNumber - 1,
            ),
            modified: replaceContent(
              content.modified,
              newText,
              change.modifiedStartLineNumber - 1,
            ),
          };
        });
      }
    }
  };

  return (
    <Toolbar>
      <Toolbar.Header />
      {idx >= 0 ? (
        <>
          <IconButton
            icon="arrow-left"
            tooltip="Navigate to previous difference"
            onClick={() => onNavigator(true)}
          />
          <div>Difference : #{idx}</div>
          <IconButton
            icon="arrow-right"
            tooltip="Navigate to next difference"
            onClick={() => onNavigator(false)}
          />
          <IconButton
            icon="trash"
            tooltip="Accept remote diff"
            onClick={() => onKeepOne(true)}
          />
          <IconButton
            icon="angry"
            tooltip="Accept local diff"
            onClick={() => onKeepOne(false)}
          />
          <IconButton icon="save" tooltip="Accept both" onClick={onKeepAll} />
        </>
      ) : (
        <IconButton
          icon="save"
          tooltip="Keep current state"
          onClick={() => props.onResolved(content.modified)}
        />
      )}
      <Toolbar.Content>
        <SizedDiv className={overflowHide}>
          {size => {
            if (size !== undefined && diffEditor !== undefined) {
              diffEditor.layout(size);
            }
            return <div className={overflowHide} ref={setContainer} />;
          }}
        </SizedDiv>
      </Toolbar.Content>
    </Toolbar>
  );
}
