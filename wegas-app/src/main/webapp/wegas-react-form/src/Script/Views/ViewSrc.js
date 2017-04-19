import PropTypes from 'prop-types';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import classNames from 'classnames';
import styles from '../../css/string.css';
import debounced from '../../HOC/callbackDebounce';

let updated = false;
/**
 * Update Editor params
 * @param {monaco} m
 */
function editorWillMount(monaco) {
    if (!updated) {
        updated = true;
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            lib: ['ES5'],
            target: monaco.languages.typescript.ScriptTarget.ES5,
            allowNonTsExtensions: true,
            allowJs: true
        });
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        });
        import('raw-loader!./autoComplete/wegas.d.ts').then(x =>
            monaco.languages.typescript.javascriptDefaults.addExtraLib(
                x,
                'wegas.d.ts'
            )
        );
    }
}
/**
 * Toggle view between parsed and code
 */
class ViewSrc extends React.Component {
    constructor(props) {
        super(props);
        this.state = { src: false };
    }

    render() {
        let child;
        if (this.state.src || this.props.error) {
            child = [
                <MonacoEditor
                    key="code"
                    width="100%"
                    height="200"
                    options={{
                        lineNumbersMinChars: 2,
                        theme: 'vs-dark',
                        wrappingColumn: 0,
                        wrappingIndent: 'indent',
                        quickSuggestions: true
                    }}
                    language="javascript"
                    value={this.props.value}
                    onChange={v => this.props.onChange(v)}
                    editorWillMount={monaco => editorWillMount(monaco)}
                    editorDidMount={editor => editor.focus()}
                    requireConfig={{
                        url: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js',
                        paths: {
                            vs: 'wegas-react-form/dist/vs'
                        }
                    }}
                />,
                <div key="error">{this.props.error || <br />}</div>
            ];
        } else {
            child = this.props.children;
        }
        return (
            <span>
                <i
                    className={classNames('fa fa-code', styles.icon)}
                    onClick={() =>
                        this.setState({
                            src: !this.state.src
                        })}
                />
                <div>
                    {child}
                </div>
            </span>
        );
    }
}
ViewSrc.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    children: PropTypes.element.isRequired,
    error: PropTypes.string
};

export default debounced('onChange')(ViewSrc);
