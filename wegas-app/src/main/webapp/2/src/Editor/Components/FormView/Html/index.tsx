import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { Value, Editor as Ed } from 'slate';
import HtmlSerial from 'slate-html-serializer';
import { Editor } from 'slate-react';
import { inputStyle } from '../String';
import { CommonView, CommonViewContainer } from '../commonView';
import { Labeled, LabeledView } from '../labeled';
import { genBlock, genMark } from './plugins/generator';
import { bulletList } from './plugins/list';

const generated = [
  genMark({
    mark: 'italic',
    buttonIcon: 'italic',
    htmlIsMark: el => el.tagName.toLowerCase() === 'i',
    render: function italic({ children }) {
      return <i>{children}</i>;
    },
  }),
  genMark({
    mark: 'bold',
    buttonIcon: 'bold',
    htmlIsMark: el => el.tagName.toLowerCase() === 'b',
    render: function bold({ children }) {
      return <b>{children}</b>;
    },
  }),
  genBlock({
    block: 'paragraph',
    buttonIcon: 'paragraph',
    render: function paragraph(props) {
      return <p {...props} />;
    },
    htmlIsBlock: el => el.tagName.toLowerCase() === 'p',
  }),
  genBlock({
    block: 'quote',
    buttonIcon: 'quote-right',
    render: function quote(props) {
      return <blockquote {...props} />;
    },
    htmlIsBlock: el => el.tagName.toLowerCase() === 'blockquote',
  }),
  // genBlock({
  //   block: 'bullet-list',
  //   buttonIcon: 'list-ul',
  //   render: props => <ul {...props} />,
  //   htmlIsBlock: el => el.tagName.toLowerCase() === 'ul',
  // }),
  bulletList(),
];
const html = new HtmlSerial({
  rules: generated.map(g => g.transform),
});

const plugins = generated.map(g => g.plugin);

interface HtmlProps
  extends WidgetProps.BaseProps<
    { placeholder?: string } & CommonView & LabeledView
  > {
  value?: string;
}
interface HtmlState {
  value: Value;
  rawValue: string;
  oldProps: HtmlProps;
}
export default class Html extends React.Component<HtmlProps, HtmlState> {
  editor = React.createRef<Ed>();
  static getDerivedStateFromProps(nextProps: HtmlProps, state: HtmlState) {
    if (state.oldProps === nextProps) {
      return null;
    }
    if (state.rawValue !== nextProps.value) {
      return {
        oldProps: nextProps,
        value: html.deserialize(nextProps.value || '<p></p>'),
        rawValue: nextProps.value,
      };
    }
    return { oldProps: nextProps };
  }
  state = {
    oldProps: this.props,
    rawValue: this.props.value || '<p></p>',
    value: html.deserialize(this.props.value || '<p></p>'),
  };
  onChange = ({ value }: { value: Value }) => {
    if (this.state.value.document !== value.document) {
      const oldVal = this.state.rawValue;
      this.setState({ rawValue: html.serialize(value), value }, () => {
        if (oldVal !== this.state.rawValue) {
          this.props.onChange(this.state.rawValue);
        }
      });
    } else {
      this.setState({ value });
    }
  };
  render() {
    return (
      <CommonViewContainer
        view={this.props.view}
        errorMessage={this.props.errorMessage}
      >
        <Labeled {...this.props.view}>
          {({ labelNode }) => (
            <>
              {labelNode}
              <div>
                {generated.map(g => (
                  <g.Button
                    key={g.name}
                    value={this.state.value}
                    editor={this.editor}
                  />
                ))}
              </div>
              <Editor
                //@ts-ignore
                ref={this.editor}
                className={inputStyle}
                value={this.state.value}
                onChange={this.onChange}
                plugins={plugins}
                placeholder={this.props.view.placeholder}
              />
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
