import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { Change, Value } from 'slate';
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
    render: ({ children }) => <i>{children}</i>,
  }),
  genMark({
    mark: 'bold',
    buttonIcon: 'bold',
    htmlIsMark: el => el.tagName.toLowerCase() === 'b',
    render: ({ children }) => <b>{children}</b>,
  }),
  genBlock({
    block: 'paragraph',
    buttonIcon: 'paragraph',
    render: props => <p {...props} />,
    htmlIsBlock: el => el.tagName.toLowerCase() === 'p',
  }),
  genBlock({
    block: 'quote',
    buttonIcon: 'quote-right',
    render: props => <blockquote {...props} />,
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

const EMPTY_VALUE = html.deserialize('<p/>');

interface HtmlProps extends WidgetProps.BaseProps<CommonView & LabeledView> {
  value?: string;
}
interface HtmlState {
  value: Value;
  rawValue: string;
  oldProps: HtmlProps;
}
export default class Html extends React.Component<HtmlProps, HtmlState> {
  static getDerivedStateFromProps(nextProps: HtmlProps, state: HtmlState) {
    if (state.oldProps === nextProps) {
      return null;
    }
    if (state.rawValue !== nextProps.value) {
      return {
        oldProps: nextProps,
        value: html.deserialize(nextProps.value || ''),
        rawValue: nextProps.value,
      };
    }
    return { oldProps: nextProps };
  }
  state = {
    oldProps: this.props,
    rawValue: '',
    value: EMPTY_VALUE,
  };
  onChange = ({ value }: Change) => {
    if (this.state.value.document !== value.document) {
      this.setState({ rawValue: html.serialize(value), value }, () =>
        this.props.onChange(this.state.rawValue),
      );
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
                    onChange={this.onChange}
                  />
                ))}
              </div>
              <Editor
                className={inputStyle}
                value={this.state.value}
                onChange={this.onChange}
                plugins={plugins}
              />
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
