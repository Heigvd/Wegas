import { EditorProps, Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type SrcEditorLanguages =
  | 'javascript'
  | 'plaintext'
  | 'css'
  | 'json'
  | 'typescript';
export type MonacoEditor = Monaco;
export type MonacoEditorProperties = Exclude<EditorProps['options'], undefined>;
export type MonacoLangaugesServices =
  MonacoEditor['languages']['typescript']['typescriptDefaults'];

export type MonacoIEditor = monaco.editor.IEditor;

export type MonacoSCodeEditor = monaco.editor.IStandaloneCodeEditor;
export type MonacoSDiffEditor = monaco.editor.IStandaloneDiffEditor;
export type MonacoCodeEditor = Parameters<
  Parameters<MonacoSCodeEditor['addAction']>[0]['run']
>[0];
export type MonacoEditorCursorEvent = Parameters<
  Parameters<MonacoCodeEditor['onDidChangeCursorSelection']>[0]
>[0];
export type MonacoEditorModel = monaco.editor.ITextModel;
export interface MonacoEditorSimpleToken {
  offset: number;
  type: string;
  language: string;
}
export interface MonacoDefinitionsLibrary {
  content: string;
  name: string;
}
export interface MonacoEditorSimpleRange {
  /**
   * Line number on which the range starts (starts at 1).
   */
  startLineNumber: number;
  /**
   * Column on which the range starts in line `startLineNumber` (starts at 1).
   */
  startColumn: number;
  /**
   * Line number on which the range ends.
   */
  endLineNumber: number;
  /**
   * Column on which the range ends in line `endLineNumber`.
   */
  endColumn: number;
}

export interface SrcEditorAction {
  /**
   * id - An unique identifier of the contributed action.
   */
  id: string;
  /**
   * label - A label of the action that will be presented to the user.
   */
  label: string;
  /**
   * keys - An optional array of keybindings for the action.
   */
  keybindings?: number[];
  /**
   * run - the function to be fired with the action
   */
  run: (monaco: MonacoEditor, editor: MonacoCodeEditor) => void;
}

/**
 * textToArray split a text into an array of lines
 *
 * @param text - the text to be splitted
 * @param dropBlankLines - drop blank lines
 */
export const textToArray = (
  text: string,
  dropBlankLines: boolean = false,
): string[] => {
  const lines = text.split(/\r?\n/);
  return dropBlankLines ? lines.filter(line => line) : lines;
};

/**
 * arrayToText merge an array of lines into a single string
 *
 * @param lines - the array of lines
 */
export const arrayToText = (lines: string[]): string =>
  lines.reduce((newString, line) => newString + line + '\n', '').slice(0, -1);
