import React from 'react';
import labeled from '../HOC/labeled';
import asyncComp from '../HOC/async';
import commonView from '../HOC/commonView';
import { css } from 'glamor';

type choice = {
    value: {};
    label?: string;
    disabled?: boolean;
    children?: choice[];
};
type choices = (string | choice)[];
interface ISelectProps {
    id: string;
    value?: {};
    onChange: (value: string) => void;
    view: {
        choices: (string | choice)[];
    };
}
interface IAsyncSelectProps {
    id: string;
    value?: {};
    onChange: (value: string) => void;
    view: {
        choices: (() => Promise<choices>) | choices;
        [propName: string]: {};
    };
}
const selectStyle = css({
    label: 'select-selectStyle',
    padding: '2px',
    borderRadius: '3px',
    border: '1px solid lightgray',
    width: '120px'
});

const selectContainerStyle = css({
    '& label': {
        fontSize: '100%'
    }
});

function genItems(o: string | choice, i: number) {
    if (typeof o !== 'object') {
        return (
            <option key={`k-${o}`} value={o}>
                {o}
            </option>
        );
    }
    const { label = o.value, value, disabled } = o;
    return (
        <option
            key={`k-${value}`}
            value={JSON.stringify(value)}
            disabled={disabled}
        >
            {label}
        </option>
    );
}

const title = {
    label: '- please select -',
    value: undefined,
    disabled: true
};

function SelectView(props: ISelectProps) {
    const onChange = function onChange(
        event: React.ChangeEvent<{ value: string }>
    ) {
        props.onChange(JSON.parse(event.target.value));
    };
    const choices: (choice | string)[] = props.view.choices || [];
    const menuItems = ([title] as (choice | string | typeof title)[])
        .concat(choices)
        .map(genItems);
    return (
        <select
            id={props.id}
            className={`${selectStyle}`}
            value={JSON.stringify(props.value)}
            onChange={onChange}
        >
            {menuItems}
        </select>
    );
}

function Sel({ view }: IAsyncSelectProps) {
    const { choices } = view;
    if (typeof choices === 'function') {
        return Promise.resolve(choices()).then(ch => ({
            view: { ...view, choices: ch }
        }));
    }
    return arguments[0];
}
export default commonView(
    asyncComp<IAsyncSelectProps, ISelectProps>(
        labeled(SelectView, `${selectContainerStyle}`)
    )(Sel)
);
