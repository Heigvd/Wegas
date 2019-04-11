import * as React from 'react';
import { debounce } from 'lodash-es';
import { Labeled, LabeledView } from './labeled';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonViewContainer, CommonView } from './commonView';
import { css } from 'emotion';

export interface StringInputProps
  extends WidgetProps.BaseProps<
    {
      rows?: number;
      disabled?: boolean;
      readOnly?: boolean;
      placeholder?: string;
    } & CommonView &
      LabeledView
  > {
  value?: string | number;
}

export const inputStyle = css({
  minHeight: '1.5em',
  width: '100%',
  resize: 'vertical',
  border: 'thin solid',
  '::placeholder': {
    fontStyle: 'italic',
  },
  '&[readonly]': {
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
  { value?: string | number; oldProps: StringInputProps }
> {
  static getDerivedStateFromProps(
    nextProps: StringInputProps,
    { oldProps }: { oldProps: StringInputProps },
  ) {
    if (nextProps !== oldProps) {
      return { oldProps: nextProps, value: nextProps.value };
    }
    return null;
  }
  constructor(props: StringInputProps) {
    super(props);
    this.state = { value: props.value, oldProps: props };
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
  render() {
    const { view, errorMessage } = this.props;
    return (
      <CommonViewContainer errorMessage={errorMessage} view={view}>
        <Labeled {...view}>
          {({ inputId, labelNode }) => {
            if (typeof view.rows === 'number') {
              return (
                <>
                  {labelNode}
                  <textarea
                    className={inputStyle}
                    id={inputId}
                    value={undefToEmpty(this.state.value)}
                    rows={view.rows}
                    onChange={this.onChange}
                    placeholder={view.placeholder}
                    onBlur={this.onChange}
                    disabled={view.disabled}
                    readOnly={view.readOnly}
                    autoComplete="off"
                  />
                </>
              );
            }
            return (
              <>
                {labelNode}
                <input
                  type="text"
                  className={inputStyle}
                  id={inputId}
                  value={undefToEmpty(this.state.value)}
                  onChange={this.onChange}
                  placeholder={view.placeholder}
                  onBlur={this.onChange}
                  disabled={view.disabled}
                  readOnly={view.readOnly}
                  autoComplete="off"
                />
              </>
            );
          }}
        </Labeled>
      </CommonViewContainer>
    );
  }
}
