import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import * as monaco from 'monaco-editor';
import * as t from '../../../page-schema.build';
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

export function DiffEditor({
  originalContent,
  modifiedContent,
  uri,
  language,
  onResolved,
}: DiffEditorProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const diffEditor = React.useRef<monaco.editor.IStandaloneDiffEditor>();
  const diffNavigator = React.useRef<ExtendedDiffNavigator>();

  const [idx, setIdx] = React.useState<number>(0);

  React.useEffect(() => {
    // Setting validation/autocompletion
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          fileMatch: ['page.json'],
          uri: 'internal://page-schema.json',
          schema: (t as any).schema, //eslint-disable-line @typescript-eslint/no-explicit-any
        },
      ],
    });

    // Setting up diff editor
    if (container.current !== null) {
      const editor = monaco.editor.createDiffEditor(container.current);
      editor.onDidUpdateDiff(() => {
        const changes = editor.getLineChanges();
        if (changes && changes.length === 0) {
          setIdx(-1);
        } else {
          setIdx(0);
        }
      });
      diffEditor.current = editor;

      // Setting up diff navigator
      diffNavigator.current = monaco.editor.createDiffNavigator(
        diffEditor.current,
        {
          // followsCaret: true, // resets the navigator state when the user selects something in the editor
          ignoreCharChanges: true, // jump from line to line
        },
      ) as ExtendedDiffNavigator;
    }

    return () => {
      diffNavigator.current && diffNavigator.current.dispose();
      diffEditor.current && diffEditor.current.dispose();
    };
  }, []);

  React.useEffect(() => {
    if (diffEditor.current) {
      const originalModel = monaco.editor.createModel(
        '',
        language,
        uri ? monaco.Uri.parse(uri) : undefined,
      );
      const modifiedModel = monaco.editor.createModel(
        '',
        language,
        uri ? monaco.Uri.parse(uri) : undefined,
      );

      diffEditor.current.setModel({
        original: originalModel,
        modified: modifiedModel,
      });

      diffEditor.current.layout();
    }
  }, [language, uri]);

  React.useEffect(() => {
    if (diffEditor.current) {
      diffEditor.current.getOriginalEditor().setValue(originalContent);
    }
  }, [originalContent]);

  React.useEffect(() => {
    if (diffEditor.current) {
      diffEditor.current.getModifiedEditor().setValue(modifiedContent);
    }
  }, [modifiedContent]);

  React.useEffect(() => {
    if (diffEditor.current) {
      diffEditor.current.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
        () => {
          if (idx !== -1 || !diffEditor.current) {
            alert('You must resolve all differences before saving');
          } else {
            onResolved(diffEditor.current.getOriginalEditor().getValue());
          }
        },
      );
    }
  }, [idx, onResolved]);

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

  interface DiffEditorLineChanges {
    modifiedEndLineNumber: number;
    modifiedStartLineNumber: number;
    originalEndLineNumber: number;
    originalStartLineNumber: number;
  }

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
    if (diffEditor.current && idx >= 0) {
      const content = diffEditor.current.getOriginalEditor().getValue();
      const change = (diffEditor.current.getLineChanges() as DiffEditorLineChanges[])[
        idx
      ];
      const modified = diffEditor.current.getModifiedEditor().getValue();
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
        diffEditor.current.getModifiedEditor().setValue(savedContent);
      } else {
        diffEditor.current.getOriginalEditor().setValue(savedContent);
      }
    }
  };

  const onKeepAll = () => {
    if (diffEditor.current && idx >= 0) {
      const content = diffEditor.current.getOriginalEditor().getValue();
      const modified = diffEditor.current.getModifiedEditor().getValue();
      const change = (diffEditor.current.getLineChanges() as DiffEditorLineChanges[])[
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
      diffEditor.current
        .getModifiedEditor()
        .setValue(
          replaceContent(
            modified,
            newText,
            change.modifiedStartLineNumber - 1,
            change.modifiedEndLineNumber - 1,
          ),
        );
      diffEditor.current
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
            onClick={() =>
              diffEditor.current &&
              onResolved(diffEditor.current.getOriginalEditor().getValue())
            }
          />
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        <SizedDiv className={overflowHide}>
          {size => {
            if (size !== undefined && diffEditor.current !== undefined) {
              diffEditor.current.layout(size);
            }
            return <div className={overflowHide} ref={container} />;
          }}
        </SizedDiv>
      </Toolbar.Content>
    </Toolbar>
  );
}
