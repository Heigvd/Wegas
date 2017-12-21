import React from 'react';
import deb from 'lodash-es/debounce';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import { css } from 'glamor';

export const inputStyle = css({
    label: 'string-inputStyle',
    borderRadius: '3px',
    boxSizing: 'border-box',
    border: '1px solid lightgrey',
    fontSize: '13px',
    color: 'darkslategrey',
    boxShadow: '1px 1px 4px #ccc',
    width: '100%',
    '::placeholder': {
        fontStyle: 'italic',
    },
    '[readonly]': {
        backgroundColor: 'lightgrey',
    },
});

const textareaFocus = css({
    label: 'string-textareaFocus',
    ':focus': {
        border: '1px solid lightgrey',
    },
});

const textareaStyle = css(
    {
        label: 'string-textareaStyle',
        borderRadius: '3px',
        width: '100%',
        fontStyle: 'italic',
        fontSize: '15px',
        border: 'none',
        color: 'darkgrey',
        '[readonly]': {
            backgroundColor: 'lightgrey',
        },
    },
    textareaFocus
);

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
        readOnly?: boolean;
        placeholder?: string;
        [propName: string]: undefined | {};
    };
    onChange: (value: string) => void;
}
class StringView extends React.Component<
    IStringProps,
    { value: string | number }
> {
    debouncedOnChange: ((value: string) => void) & _.Cancelable;
    constructor(props: IStringProps) {
        super(props);
        this.state = { value: fromNotToEmpty(props.value) };
        this.handleChange = this.handleChange.bind(this);
        this.debouncedOnChange = deb(props.onChange, 300);
    }
    componentWillReceiveProps(nextProps: IStringProps) {
        this.setState({ value: fromNotToEmpty(nextProps.value) });
        if (nextProps.onChange !== this.props.onChange) {
            this.debouncedOnChange.flush();
            this.debouncedOnChange = deb(nextProps.onChange, 300);
        }
    }
    componentWillUnmout() {
        this.debouncedOnChange.flush();
    }
    handleChange(
        event:
            | React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
            | React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>
    ) {
        const value = event.currentTarget.value;
        const eventType = event.type;
        this.setState({ value }, () => {
            if (eventType === 'change') {
                this.debouncedOnChange(value);
            } else {
                this.props.onChange(value);
            }
        });
    }
    render() {
        if (typeof this.props.view.rows === 'number') {
            return (
                <textarea
                    id={this.props.id}
                    className={textareaStyle.toString()}
                    rows={this.props.view.rows}
                    onChange={this.handleChange}
                    onBlur={this.handleChange}
                    placeholder={this.props.view.placeholder}
                    value={this.state.value}
                    disabled={this.props.view.disabled}
                    readOnly={this.props.view.readOnly}
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
                onChange={this.handleChange}
                onBlur={this.handleChange}
                disabled={this.props.view.disabled}
                readOnly={this.props.view.readOnly}
            />
        );
    }
}

export default commonView(labeled(StringView));
