import generate from '@babel/generator';
import { Statement, program } from '@babel/types';
import { parse } from '@babel/parser';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import SrcEditor from '../../SrcEditor';
import { FontAwesome } from '../../Views/FontAwesome';
import { CommonView, CommonViewContainer } from '../commonView';
import { Labeled, LabeledView } from '../labeled';
import { Statements } from './Statements';

function scriptObject(script?: string | IScript | null) {
  return typeof script === 'object' && script != null
    ? script.content
    : script || '';
}
interface ScriptBodyProps {
  script?: IScript | string | null;
  onChange: (script: IScript) => void;
  children: (
    props: { ast: Statement[]; onChange: (ast: Statement[]) => void },
  ) => JSX.Element;
}
function ScriptBody({ script, onChange, children }: ScriptBodyProps) {
  const code = scriptObject(script);
  const ast = parse(code, { sourceType: 'script' });
  function transform(ast: Statement[]) {
    onChange({
      '@class': 'Script',
      language: 'JavaScript',
      content: generate(program(ast)).code,
    });
  }
  return children({ ast: ast.program.body, onChange: transform });
}

interface ScriptProps extends WidgetProps.BaseProps<LabeledView & CommonView> {
  value?: string | IScript;
  onChange: (code: IScript) => void;
}
interface ScriptState {
  srcMode: boolean;
  error?: string;
  oldProps: ScriptProps;
}
export class Script extends React.Component<ScriptProps, ScriptState> {
  static getDerivedStateFromProps(nextProps: ScriptProps, state: ScriptState) {
    if (state.oldProps === nextProps) {
      return null;
    }
    return { oldProps: nextProps, error: undefined };
  }
  state: ScriptState = {
    oldProps: this.props,
    srcMode: true,
    error: undefined,
  };
  toggleSrc = () => {
    this.setState(s => ({ srcMode: !s.srcMode }));
  };
  componentDidCatch(error: Error) {
    this.setState({ srcMode: true, error: error.message });
  }
  render() {
    const props = this.props;
    return (
      <CommonViewContainer
        view={props.view}
        errorMessage={
          this.state.error ? [this.state.error] : props.errorMessage
        }
      >
        <Labeled {...props.view}>
          {({ labelNode }) => (
            <>
              {labelNode}
              <button onClick={this.toggleSrc}>
                <FontAwesome icon="code" />
              </button>
              {this.state.srcMode ? (
                <div
                  style={{
                    position: 'relative',
                    height: '5em',
                    minWidth: '33em',
                  }}
                >
                  <SrcEditor
                    value={scriptObject(props.value)}
                    onChange={v =>
                      props.onChange({
                        '@class': 'Script',
                        language: 'JavaScript',
                        content: v,
                      })
                    }
                  />
                </div>
              ) : (
                <ScriptBody script={props.value} onChange={props.onChange}>
                  {({ ast, onChange }) => (
                    <Statements statements={ast} onChange={onChange} />
                  )}
                </ScriptBody>
              )}
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
