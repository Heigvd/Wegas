import * as React from 'react';
import deb from 'lodash-es/debounce';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import { css } from 'glamor';

export const inputStyle = css({
    boxSizing: 'border-box',
    border: '1px solid #BFBFBF',
    fontSize: '13px',
    color: 'darkslategrey',
    minHeight: '1.5em',
    width: '100%',
    resize: 'vertical',
    '::placeholder': {
        fontStyle: 'italic',
    },
    '[readonly]': {
        backgroundColor: 'lightgrey',
    },
    '[type=text]': {
        padding: '4px',
    },
    '[type=password]': {
        padding: '4px',
    },
    '[type=search]': {
        padding: '4px',
    },
});

function fromNotToEmpty(value?: string | number) {
    if (value == null) {
        return '';
    }
    return value;
}

interface IStringProps {
    id: string;
    value?: string | number;
    blurOnly?: boolean;
    view: {
        rows?: number;
        disabled?: boolean;
        readOnly?: boolean;
        placeholder?: string;
        [propName: string]: undefined | {};
    };
    onChange: (value: string) => void;
}

function StringView(props: IStringProps) {
    const [value, setValue] = React.useState(fromNotToEmpty(props.value));
    const onChange = React.useRef(props.onChange);
    onChange.current = props.onChange;
    const debounced = React.useCallback(
        deb((v: string) => {
            onChange.current(v);
        }, 300),
        []
    );
    React.useEffect(() => () => debounced.flush(), [debounced]);

    function handleChange(event: { target: { value: string }; type: string }) {
        if (event.target.value !== fromNotToEmpty(props.value)) {
            setValue(event.target.value);
            if (!props.blurOnly || event.type === 'blur') {
                debounced(event.target.value);
                if (event.type === 'blur') {
                    debounced.flush();
                }
            }
        }
    }

    React.useEffect(() => setValue(fromNotToEmpty(props.value)), [props.value]);
    if (typeof props.view.rows === 'number') {
        return (
            <textarea
                id={props.id}
                className={inputStyle.toString()}
                rows={props.view.rows}
                onChange={handleChange}
                onBlur={handleChange}
                placeholder={props.view.placeholder}
                value={value}
                disabled={props.view.disabled}
                readOnly={props.view.readOnly}
                autoComplete="off"
            />
        );
    }
    return (
        <input
            id={props.id}
            className={inputStyle.toString()}
            type="text"
            placeholder={props.view.placeholder}
            value={value}
            onChange={handleChange}
            onBlur={handleChange}
            disabled={props.view.disabled}
            readOnly={props.view.readOnly}
            autoComplete="off"
        />
    );
}
export default commonView(labeled(StringView));
