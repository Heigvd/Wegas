import { css, cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
// import HTMLEditor from '../../../Components/HTML/HTMLEditor';
import HTMLEditor from '../../../Components/HTML/HTMLEditor';
import { defaultMarginTop, flex, flexColumn } from '../../../css/classes';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

const labeledHTMLEditorStyle = css({
  display: 'inline-block',
});

interface HtmlProps
  extends WidgetProps.BaseProps<
    { placeholder?: string } & CommonView & LabeledView & { noResize?: boolean }
  > {
  value?: string;
}
interface HtmlState {
  value: string;
  oldProps: HtmlProps;
}
export class LabeledHTMLEditor extends React.Component<HtmlProps, HtmlState> {
  static getDerivedStateFromProps(nextProps: HtmlProps, state: HtmlState) {
    if (state.oldProps === nextProps) {
      return null;
    }
    if (state.value !== nextProps.value) {
      return {
        oldProps: nextProps,
        value: nextProps.value,
      };
    }
    return { oldProps: nextProps };
  }
  state = {
    oldProps: this.props,
    value: this.props.value || '<p></p>',
  };
  render() {
    return (
      <CommonViewContainer
        view={this.props.view}
        errorMessage={this.props.errorMessage}
      >
        <Labeled {...this.props.view}>
          {({ labelNode, inputId }) => (
            <div className={cx(flex, flexColumn, defaultMarginTop)}>
              {labelNode}
              <HTMLEditor
                value={this.state.value}
                onChange={this.props.onChange}
                className={labeledHTMLEditorStyle}
                id={inputId}
                toolbarLayout='full'
                // noResize={this.props.view.noResize}
              />
            </div>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
