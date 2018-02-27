import * as React from 'react';
import { debounce } from 'lodash-es';
import { Labeled } from './labeled';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { css } from 'glamor';
interface StringInputProps extends WidgetProps.BaseProps<'string' | 'number'> {
  value?: string | number;
  view: {
    type?: any;
    rows?: number;
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
  };
}

const inputStyle = css({
  minHeight: '1.5em',
  width: '100%',
  resize: 'vertical',
  border: 'thin solid',
  '::placeholder': {
    fontStyle: 'italic',
  },
  '[readonly]': {
    backgroundColor: 'lightgrey',
  },
});
function undefToEmpty(val?: string | number) {
  if (val == null) {
    return '';
  }
  return val;
}
export default class StringInput extends React.Component<
  StringInputProps,
  { value?: string | number }
> {
  constructor(props: StringInputProps) {
    super(props);
    this.state = { value: props.value };
  }
  debouncedOnChange = debounce((value: string) => {
    this.props.onChange(value);
  }, 500);
  onChange = (
    ev:
      | React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
      | React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const value = ev.currentTarget.value;
    const type = ev.type;
    this.setState({ value }, () => {
      if (type === 'change') {
        this.debouncedOnChange(value);
      } else {
        this.props.onChange(value);
      }
    });
  };
  componentWillReceiveProps(nextProps: StringInputProps) {
    this.setState({ value: nextProps.value });
  }
  render() {
    const { view, errorMessage } = this.props;
    return (
      <CommonView errorMessage={errorMessage} view={view}>
        <Labeled {...view}>
          {({ inputId, labelNode }) => {
            if (typeof view.rows === 'number') {
              return (
                <>
                  {labelNode}
                  <div>
                    <textarea
                      {...inputStyle}
                      id={inputId}
                      value={undefToEmpty(this.state.value)}
                      rows={view.rows}
                      onChange={this.onChange}
                      placeholder={view.placeholder}
                      onBlur={this.onChange}
                      disabled={view.disabled}
                      readOnly={view.readOnly}
                    />
                  </div>
                </>
              );
            }
            return (
              <>
                {labelNode}
                <div>
                  <input
                    type="text"
                    {...inputStyle}
                    id={inputId}
                    value={undefToEmpty(this.state.value)}
                    onChange={this.onChange}
                    placeholder={view.placeholder}
                    onBlur={this.onChange}
                    disabled={view.disabled}
                    readOnly={view.readOnly}
                  />
                </div>
              </>
            );
          }}
        </Labeled>
      </CommonView>
    );
  }
}
