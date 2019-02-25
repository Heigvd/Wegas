import React from 'react';
import labeled from '../HOC/labeled';
import { useAsync } from '../Hooks/async';
import commonView from '../HOC/commonView';
import { css } from 'glamor';

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

interface SelectProps {
    id: string;
    value?: {};
    onChange: (value: string) => void;
    view: {
        choices: (() => Promise<Choices>) | Choices;
        readOnly?: boolean;
        [propName: string]: {} | undefined;
    };
}
const selectStyle = css({
    padding: '2px 4px 3px 4px',
    border: '1px solid lightgray',
    maxWidth: '100%',
});
function genItems(o: string | Choice, i: number) {
    if (typeof o !== 'object') {
        return (
            <option key={`k-${o}`} value={JSON.stringify(o)}>
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

const title: Choice = {
    value: '[[[default]]]',
    label: '- please select -',
    selected: true,
    disabled: true,
};
function choiceResolve(choices: (() => Promise<Choices>) | Choices = []) {
    if (typeof choices === 'function') {
        return Promise.resolve(choices());
    }
    return Promise.resolve(choices);
}
function SelectView(props: SelectProps) {
    const result = useAsync(choiceResolve(props.view.choices), [
        props.view.choices,
    ]);
    if (result.status === 'pending') {
        return null;
    }
    if (result.status === 'rejected') {
        throw result.error;
    }
    const { data } = result;
    const onChange = function onChange(
        event: React.ChangeEvent<{ value: string }>
    ) {
        props.onChange(JSON.parse(event.target.value));
    };
    const choices: (Choice | string)[] = ([title] as (
        | Choice
        | string)[]).concat(data);
    const menuItems = choices.map(genItems);

    let value = JSON.stringify(props.value);

    if (!menuItems.find(item => item.props.value === value)) {
        value = JSON.stringify(title.value);
    }

    return (
        <select
            id={props.id}
            className={`${selectStyle}`}
            value={value}
            onChange={onChange}
            disabled={props.view.readOnly}
        >
            {menuItems}
        </select>
    );
}

export default commonView(labeled(SelectView));
