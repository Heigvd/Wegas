import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled, LabeledView } from './labeled';
import { CommonViewContainer, CommonView } from './commonView';
interface BooleanProps extends WidgetProps.BaseProps<CommonView & LabeledView> {
  value?: boolean;
  readOnly?: boolean;
}
export default class BooleanView extends React.Component<BooleanProps> {
  onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.props.onChange(event.target.checked);

  render() {
    const { view, errorMessage, value, readOnly } = this.props;
    return (
      <CommonViewContainer errorMessage={errorMessage} view={view}>
        <Labeled {...view}>
          {({ inputId, labelNode }) => (
            <>
              <input
                id={inputId}
                checked={value || false}
                type="checkbox"
                readOnly={view.readOnly}
                onChange={this.onChange}
                readOnly={readOnly}
              />
              {labelNode}
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
