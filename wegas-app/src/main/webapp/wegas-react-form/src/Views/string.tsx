import React from 'react';
import debounce from '../HOC/callbackDebounce';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import { css } from 'glamor';
import FormStyles from './form-styles';

const inputStyle = css({
    borderRadius: '3px',
    boxSizing: 'border-box',
    border: '1px solid lightgrey',
    fontSize: '13px',
    color: 'darkslategrey',
    boxShadow: '1px 1px 4px #ccc',
    width: '100%',
    maxWidth: FormStyles.textInputWidth,
    padding: '0px'
});

const textareaFocus = css({
    ':focus': {
        border: '1px solid lightgrey'
    }
});

const textareaStyle = css(
    {
        borderRadius: '3px',
        width: '100%',
        maxWidth: FormStyles.textareaWidth,
        fontStyle: 'italic',
        fontSize: '15px',
        border: 'none',
        color: 'darkgrey'
    },
    textareaFocus
);

const debounceOnChange = debounce('onChange');
function fromNotToEmpty(value?: void | string | number) {
    if (value === null || value === undefined) {
        return '';
    }
    return value;
}

interface IStringProps {
    id: string;
    value?: string | number;
    view: {
        rows?: number;
        disabled?: boolean;
        placeholder?: string;
        [propName: string]: undefined | {};
    };
    onChange: (value: string) => void;
}
type StringProps = IStringProps;
class StringView extends React.Component<
    StringProps,
    { value: string | number }
> {
    constructor(props: StringProps) {
        super(props);
        this.state = { value: fromNotToEmpty(props.value) };
    }
    componentWillReceiveProps(nextProps: StringProps) {
        this.setState({ value: fromNotToEmpty(nextProps.value) });
    }
    handleChange(
        event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) {
        const v = event.target.value;
        this.setState({ value: v }, () => this.props.onChange(v));
    }
    render() {
        if (typeof this.props.view.rows === 'number') {
            return (
                <textarea
                    id={this.props.id}
                    className={textareaStyle.toString()}
                    rows={this.props.view.rows}
                    onChange={ev => this.handleChange(ev)}
                    placeholder={this.props.view.placeholder}
                    value={this.state.value}
                    disabled={this.props.view.disabled}
                />
            );
        }
        return (
            <input
                id={this.props.id}
                className={inputStyle.toString()}
                type="text"
                placeholder={this.props.view.placeholder}
                value={this.state.value}
                onChange={ev => this.handleChange(ev)}
                disabled={this.props.view.disabled}
            />
        );
    }
}

export default commonView(labeled(debounceOnChange<StringProps>(StringView)));
