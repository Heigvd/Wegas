import React from 'react';
import classNames from 'classnames';
import labeled from '../HOC/labeled';
import asyncComp from '../HOC/async';
import commonView from '../HOC/commonView';
import { css } from 'glamor';
import { WidgetProps } from "jsoninput/typings/types";

type choice = { value: string, label?: string, disabled?: boolean, children?: choice[] };

interface ISelectViewProps {
    value?: string,
    view: {
        className?: string,
        choices: (string | choice)[]
    }
}

const selectStyle = css({
    padding: '2px',
    borderRadius: '3px',
    border: '1px solid lightgray'
});

const selectContainerStyle = css({
    '& label': {
        fontSize: '100%'
    }
});

function genItems(o: (string | choice), i: number) {
    if (typeof o !== 'object') {
        return (
            <option
                key={`k-${o}`}
                value={o}
            >
                {o}
            </option>
        );
    }
    const { label = o.value, value, disabled } = o;
    return (
        <option
            key={`k-${value}`}
            value={value}
            disabled={disabled}
        >
            {label}
        </option>
    );
}

const title= {
    label: "- please select -",
    value: undefined,
    disabled: true
};

function SelectView(props: ISelectViewProps & WidgetProps.BaseProps) {
    const onChange = function onChange(event: React.ChangeEvent<{ value: string }>) {
        props.onChange(event.target.value);
    };
    const choices: (choice | string)[] = props.view.choices || [];
    const menuItems = ([title] as (choice | string | typeof title)[]).concat(choices).map(genItems);
    return (
        <select
            className={classNames(props.view.className, `${selectStyle}`)}
            value={props.value || ''}
            onChange={onChange}
        >
            {menuItems}
        </select>
    );
}
/*
SelectView.defaultProps = {
    errorMessage: []
};
*/

export default commonView(asyncComp(labeled(SelectView, `${selectContainerStyle}`))(({ view }: any) => {       // @TODO any what ?
    const { choices } = view;
    if (typeof choices === 'function') {
        return Promise.resolve(choices()).then(ch => ({ view: { ...view, choices: ch } }));
    }
    return {};
})
);

