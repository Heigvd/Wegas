import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { css } from 'glamor';

interface SrcEditorProps {
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
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
  editor?: MonacoEditor | null;
  static defaultProps = {
    language: 'javascript',
  };
  constructor(props: SrcEditorProps) {
    super(props);
  }
  getValue() {
    if (this.editor != null) {
      return this.editor.editor.getValue();
    }
  }
  render() {
    return (
      <div {...overflowHide}>
        <MonacoEditor
          ref={n => (this.editor = n)}
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
