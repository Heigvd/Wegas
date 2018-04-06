import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled } from './labeled';
import { CommonViewContainer } from './commonView';

export default class BooleanView extends React.Component<
  WidgetProps.BaseProps<'boolean'> & { value?: boolean }
> {
  onChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.props.onChange(event.target.checked);
  render() {
    const { view, errorMessage, value } = this.props;
    return (
      <CommonViewContainer errorMessage={errorMessage} view={view}>
        <Labeled {...view}>
          {({ inputId, labelNode }) => (
            <>
              <input
                id={inputId}
                checked={value}
                type="checkbox"
                onChange={this.onChange}
              />
              {labelNode}
            </>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
