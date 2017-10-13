import React from 'react';
import labeled from '../HOC/labeled';
import asyncComp from '../HOC/async';
import commonView from '../HOC/commonView';
import { css } from 'glamor';
import classNames from 'classnames';

interface Choice {
    value: {};
    label?: string;
    disabled?: boolean;
    selected?: boolean;
    view?: {
        cssClass?: string;
    };
    children?: Choice[];
}
type Choices = (string | Choice)[];
interface ISelectProps {
    id: string;
    value?: {};
    onChange: (value: string) => void;
    view: {
        choices: (string | Choice)[];
        hidden?: boolean;
    };
}
interface IAsyncSelectProps {
    id: string;
    value?: {};
    onChange: (value: string) => void;
    view: {
        choices: (() => Promise<Choices>) | Choices;
        [propName: string]: {};
    };
}
const selectStyle = css({
    label: 'select-selectStyle',
    padding: '2px',
    borderRadius: '3px',
    border: '1px solid lightgray',
    width: '130px',
});

const hiddenStyle = css({
    label: 'select-hiddenStyle',
    display: 'none',
});

const selectContainerStyle = css({
    '& label': {
        fontSize: '100%',
    },
});

function genItems(o: string | Choice, i: number) {
    if (typeof o !== 'object') {
        return (
            <option key={`k-${o}`} value={o}>
                {o}
            </option>
        );
    }
    const { label = o.value, value, disabled, selected } = o;
    return (
        <option
            key={`k-${value}`}
            value={JSON.stringify(value)}
            disabled={disabled}
            selected={selected}
        >
            {label}
        </option>
    );
}

const title = {
    label: '- please select -',
    selected: true,
    disabled: true,
};

function SelectView(props: ISelectProps) {
    const onChange = function onChange(
        event: React.ChangeEvent<{ value: string }>
    ) {
        props.onChange(JSON.parse(event.target.value));
    };
    const choices: (Choice | string)[] = props.view.choices || [];
    const menuItems = ([title] as (Choice | string | typeof title)[])
        .concat(choices)
        .map(genItems);
    const hidden = props.view.hidden ? `${hiddenStyle}` : '';
    const value = JSON.stringify(props.value);
    return (
        <select
            id={props.id}
            className={classNames(`${selectStyle}`, hidden)}
            value={value}
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
            view: { ...view, choices: ch },
        }));
    }
    return arguments[0];
}
export default commonView(
    asyncComp<IAsyncSelectProps, ISelectProps>(
        labeled(SelectView, `${selectContainerStyle}`)
    )(Sel)
);
