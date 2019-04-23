import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../Components/SizedDiv';
import * as monaco from 'monaco-editor';
import * as t from '../../page-schema.build';

interface EditorProps {
  value?: string;
  uri?: 'internal://page.json';
  readonly?: boolean;
  minimap: boolean;
  language: 'javascript' | 'css' | 'json';
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
}

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});
class SrcEditor extends React.Component<EditorProps> {
  private editor: ReturnType<
    typeof import('monaco-editor').editor.create
  > | null = null;
  private lastValue?: string = '';
  private outsideChange: boolean = false;
  private container: HTMLDivElement | null = null;

  static defaultProps = {
    language: 'javascript',
    minimap: false,
    onBlur: () => {},
    onChange: () => {},
  };
  constructor(props: EditorProps) {
    super(props);
  }
  shouldComponentUpdate(nextProps: EditorProps) {
    this.editor!.updateOptions({ readOnly: nextProps.readonly });
    return (
      nextProps.value !== this.lastValue ||
      this.props.language !== nextProps.language
    );
  }
  componentDidUpdate(prevProps: EditorProps) {
    if (this.lastValue !== this.props.value) {
      this.lastValue = this.props.value;
      this.outsideChange = true;
      if ('string' === typeof this.props.value) {
        this.editor!.setValue(this.props.value);
      } else {
        this.editor!.setValue('');
      }
      this.outsideChange = false;
    }
    if (this.props.language !== prevProps.language) {
      import('monaco-editor').then(monaco => {
        monaco.editor.setModelLanguage(
          this.editor!.getModel()!,
          this.props.language,
        );
      });
    }
    this.editor!.layout();
  }
  componentDidMount() {
    this.lastValue = this.props.value;
    // Pourquoi avoir fait ça ici et n'avoir donné aucune explication? Est-ce important?
    // Promise.all([
    //   import('monaco-editor'),
    //   import('../../page-schema.build'),
    // ]).then(([monaco, t]) => {
    if (this.container != null) {
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
      const model = monaco.editor.createModel(
        this.props.value || '',
        this.props.language,
        this.props.uri ? monaco.Uri.parse(this.props.uri) : undefined,
      );
      this.editor = monaco.editor.create(this.container, {
        theme: 'vs-dark',
        model: model,
        minimap: { enabled: this.props.minimap },
        readOnly: this.props.readonly,
      });
      this.editor.onDidBlurEditorText(() => {
        this.lastValue = this.editor!.getValue();
        this.props.onBlur(this.lastValue);
      });
      this.editor.onDidChangeModelContent(() => {
        if (!this.outsideChange) {
          this.lastValue = this.editor!.getValue();
          this.props.onChange(this.lastValue);
        }
      });
    }
    // });
  }
  private layout = (size: { width: number; height: number }) => {
    if (this.editor != null) {
      this.editor.layout(size);
    }
  };
  getValue() {
    if (this.editor != null) {
      return this.editor.getValue();
    }
    return this.props.value;
  }
  componentWillUnmount() {
    if (this.editor != null && this.editor.getModel() !== null) {
      this.editor.getModel()!.dispose();
      this.editor.dispose();
    }
  }
  refContainer = (n: HTMLDivElement | null) => {
    this.container = n;
  };
  render() {
    return (
      <SizedDiv className={overflowHide}>
        {size => {
          if (size !== undefined) {
            this.layout(size);
          }
          return <div className={overflowHide} ref={this.refContainer} />;
        }}
      </SizedDiv>
    );
  }
}
export default SrcEditor;
