import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { css } from 'glamor';
import ReactMonacoEditor from 'react-monaco-editor';

interface SrcEditorProps {
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
}
const req = {
  url: 'dist/vs/loader.js',
  paths: {
    vs: 'dist/vs',
  },
};
const overflowHide = css({
  overflow: 'hidden',
  height: '100%',
});
class SrcEditor extends React.Component<SrcEditorProps> {
  editor: monaco.editor.ICodeEditor | null = null;
  static defaultProps = {
    language: 'javascript',
  };
  private _disposables: monaco.IDisposable[] = [];
  constructor(props: SrcEditorProps) {
    super(props);
  }
  editorDidMount = (editor: ReactMonacoEditor['editor']) => {
    this.editor = editor;
    this._disposables.push(
      this.editor.onDidBlurEditor(() => {
        if (typeof this.props.onBlur === 'function') {
          this.props.onBlur(this.getValue());
        }
      }),
    );
  };
  getValue() {
    if (this.editor != null) {
      return this.editor.getValue();
    }
    return '';
  }
  componentWillMount() {
    this._disposables.forEach(d => d.dispose());
    this._disposables.length = 0;
  }
  render() {
    return (
      <div {...overflowHide}>
        <MonacoEditor
          editorDidMount={this.editorDidMount}
          width="100%"
          height="100%"
          language={this.props.language}
          theme="vs-dark"
          value={this.props.value}
          onChange={this.props.onChange}
          requireConfig={req}
        />
      </div>
    );
  }
}
export default SrcEditor;
