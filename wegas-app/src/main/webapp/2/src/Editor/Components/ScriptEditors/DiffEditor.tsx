import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import { Toolbar } from '../../../Components/Toolbar';
import { IconButton } from '../../../Components/Button/IconButton';
import { themeVar } from '../../../Components/Theme';

export const diffLabel = css({
  color: themeVar.primaryLighterColor,
  padding: '5px',
});

interface DiffEditorProps {
  originalContent: string;
  modifiedContent: string;
  uri?: 'internal://page.json';
  language: 'javascript' | 'css' | 'json';
  onResolved: (newContent: string) => void;
}

type DiffNavigator = import('monaco-editor').editor.IDiffNavigator;

interface ExtendedDiffNavigator extends DiffNavigator {
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

interface DiffEditorLineChanges {
  modifiedEndLineNumber: number;
  modifiedStartLineNumber: number;
  originalEndLineNumber: number;
  originalStartLineNumber: number;
}

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

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
  if (end < start || start < 0) {
    return null;
  }
  const splittedText = textToArray(text);
  let lines = '';
  for (let i = start; i <= end && i < splittedText.length; i += 1) {
    lines += splittedText[i] + '\n';
  }
  return lines;
};

const replaceContent = (
  text: string,
  line: string | null, // If null, remove line
  start: number,
  end: number,
): string => {
  const splittedText = textToArray(text);
  const length = end - start;
  if (line === null) {
    splittedText.splice(start, length + 1);
  } else {
    splittedText.splice(
      start,
      length + 1,
      line.replace(new RegExp('\n$'), ''), // eslint-disable-line no-control-regex
    );
  }
  return arrayToText(splittedText);
};

const insertContent = (
  text: string,
  line: string | null,
  position: number,
): string => {
  if (line !== null) {
    const splittedText = textToArray(text);
    splittedText.splice(
      position,
      0,
      line.replace(
        new RegExp('\n$'), // eslint-disable-line no-control-regex
        '',
      ),
    );
    return arrayToText(splittedText);
  }
  return text;
};

export function DiffEditor({
  originalContent,
  modifiedContent,
  uri,
  language,
  onResolved,
}: DiffEditorProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const diffNavigator = React.useRef<ExtendedDiffNavigator>();
  const [diffEditor, setDiffEditor] = React.useState<
    import('monaco-editor').editor.IStandaloneDiffEditor
  >();

  const [idx, setIdx] = React.useState<number>(0);

  const onSave = React.useCallback(() => {
    if (diffEditor) {
      if (idx !== -1) {
        alert('You must resolve all differences before saving');
      } else {
        onResolved(diffEditor.getOriginalEditor().getValue());
      }
    }
  }, [diffEditor, onResolved, idx]);

  React.useEffect(() => {
    Promise.all([
      import('monaco-editor'),
      import('../../../page-schema.build'),
    ]).then(([monaco, t]) => {
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

      if (diffEditor) {
        diffEditor.dispose();
      }
      if (diffNavigator.current) {
        diffNavigator.current.dispose();
      }

      if (container.current) {
        const tempDiffEditor = monaco.editor.createDiffEditor(
          container.current,
          {
            theme: 'vs-dark',
          },
        );
        tempDiffEditor.onDidUpdateDiff(() => {
          if (tempDiffEditor) {
            const changes = tempDiffEditor.getLineChanges();
            if (changes && changes.length === 0) {
              setIdx(-1);
            } else {
              setIdx(0);
            }
          }
        });
        tempDiffEditor.setModel({
          original: monaco.editor.createModel(''),
          modified: monaco.editor.createModel(''),
        });

        diffNavigator.current = monaco.editor.createDiffNavigator(
          tempDiffEditor,
          { ignoreCharChanges: true },
        ) as ExtendedDiffNavigator;

        setDiffEditor(tempDiffEditor);
      }
    });

    return () => {
      if (diffNavigator.current) {
        diffNavigator.current.dispose();
      }
      if (diffEditor) {
        const originalModel = diffEditor.getOriginalEditor().getModel();
        const modifiedModel = diffEditor.getModifiedEditor().getModel();
        if (originalModel) {
          originalModel.dispose();
        }
        if (modifiedModel) {
          modifiedModel.dispose();
        }
        diffEditor.dispose();
      }
    };
  }, []); //eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (diffEditor && language) {
      import('monaco-editor').then(monaco => {
        const originalModel = diffEditor.getOriginalEditor().getModel();
        const modifiedModel = diffEditor.getModifiedEditor().getModel();
        if (language && originalModel && modifiedModel) {
          monaco.editor.setModelLanguage(originalModel, language);
          monaco.editor.setModelLanguage(modifiedModel, language);
        }
      });
    }
  }, [diffEditor, language]);

  React.useEffect(() => {
    if (diffEditor) {
      import('monaco-editor').then(monaco => {
        const originalModel = diffEditor.getOriginalEditor().getModel();
        const modifiedModel = diffEditor.getModifiedEditor().getModel();
        if (originalModel && modifiedModel) {
          const oldOriginalValue = originalModel.getValue();
          const oldModifiedlValue = modifiedModel.getValue();
          const oldLanguage = originalModel.getModeId();
          originalModel.dispose();
          modifiedModel.dispose();
          diffEditor
            .getOriginalEditor()
            .setModel(
              monaco.editor.createModel(
                oldOriginalValue,
                oldLanguage,
                uri ? monaco.Uri.parse(uri) : undefined,
              ),
            );
          diffEditor
            .getModifiedEditor()
            .setModel(
              monaco.editor.createModel(
                oldModifiedlValue,
                oldLanguage,
                uri ? monaco.Uri.parse(uri) : undefined,
              ),
            );
        }
      });
    }
  }, [diffEditor, uri]);

  React.useEffect(() => {
    if (diffEditor) {
      diffEditor.getOriginalEditor().setValue(originalContent);
    }
  }, [diffEditor, originalContent]);

  React.useEffect(() => {
    if (diffEditor) {
      diffEditor.getModifiedEditor().setValue(modifiedContent);
    }
  }, [diffEditor, modifiedContent]);

  React.useEffect(() => {
    if (diffEditor) {
      import('monaco-editor').then(monaco => {
        diffEditor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
          onSave,
        );
      });
    }
  }, [diffEditor, onSave]);

  const onNavigator = (next: boolean) => {
    if (diffNavigator.current) {
      if (next) {
        diffNavigator.current.next();
      } else {
        diffNavigator.current.previous();
      }
      setIdx(diffNavigator.current.nextIdx);
    }
  };

  const onKeepOne = (original: boolean) => {
    if (diffEditor && idx >= 0) {
      const content = diffEditor.getOriginalEditor().getValue();
      const change = (diffEditor.getLineChanges() as DiffEditorLineChanges[])[
        idx
      ];
      const modified = diffEditor.getModifiedEditor().getValue();
      const newContent = original ? content : modified;
      const oldContent = original ? modified : content;
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
      const savedContent =
        oldEndLine > 0 // Checks if line is missing
          ? replaceContent(
              oldContent,
              newText,
              oldStartLine - 1,
              oldEndLine - 1,
            )
          : insertContent(oldContent, newText, oldStartLine);
      if (original) {
        diffEditor.getModifiedEditor().setValue(savedContent);
      } else {
        diffEditor.getOriginalEditor().setValue(savedContent);
      }
    }
  };

  const onKeepAll = () => {
    if (diffEditor && idx >= 0) {
      const content = diffEditor.getOriginalEditor().getValue();
      const modified = diffEditor.getModifiedEditor().getValue();
      const change = (diffEditor.getLineChanges() as DiffEditorLineChanges[])[
        idx
      ];
      const origText = getTextLines(
        content,
        change.originalStartLineNumber - 1,
        change.originalEndLineNumber - 1,
      );
      const modifText = getTextLines(
        modified,
        change.modifiedStartLineNumber - 1,
        change.modifiedEndLineNumber - 1,
      );
      const newText = (origText ? origText : '') + (modifText ? modifText : '');
      diffEditor
        .getModifiedEditor()
        .setValue(
          replaceContent(
            modified,
            newText,
            change.modifiedStartLineNumber - 1,
            change.modifiedEndLineNumber - 1,
          ),
        );
      diffEditor
        .getOriginalEditor()
        .setValue(
          replaceContent(
            content,
            newText,
            change.originalStartLineNumber - 1,
            change.originalEndLineNumber - 1,
          ),
        );
    }
  };

  return (
    <Toolbar>
      <Toolbar.Header>
        {idx >= 0 ? (
          <>
            <IconButton
              icon="arrow-left"
              tooltip="Navigate to previous difference"
              onClick={() => onNavigator(false)}
            />
            <div className={diffLabel}>Difference : #{idx}</div>
            <IconButton
              icon="arrow-right"
              tooltip="Navigate to next difference"
              onClick={() => onNavigator(true)}
            />
            <IconButton
              icon="hand-point-left"
              tooltip="Accept remote diff"
              onClick={() => onKeepOne(true)}
            />
            <IconButton
              icon="hand-point-right"
              tooltip="Accept local diff"
              onClick={() => onKeepOne(false)}
            />
            <IconButton
              icon="balance-scale"
              tooltip="Accept both"
              onClick={onKeepAll}
            />
          </>
        ) : (
          <IconButton
            icon="save"
            tooltip="Save current state"
            onClick={() => onSave}
          />
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        <SizedDiv className={overflowHide}>
          {size => {
            if (size && diffEditor) {
              diffEditor.layout(size);
            }
            return <div className={overflowHide} ref={container} />;
          }}
        </SizedDiv>
      </Toolbar.Content>
    </Toolbar>
  );
}
