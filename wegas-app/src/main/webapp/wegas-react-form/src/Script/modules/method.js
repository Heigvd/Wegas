import React from 'react';
import SelectView from '../../Views/select';
import { getY } from '../../index';

const Y = getY();

function genChoices(variable) {
    const descr = Y.Wegas.Facade.Variable.cache.find('name', variable);
    const methods = descr.getMethodCfgs();
    return Object.keys(methods)
        .map(v => ({
            value: v,
            label: methods[v].label || v
        }));
}
function MethodView({ value, onChange, view }) {
    return (
        <SelectView
            value={value}
            onChange={onChange}
            view={view}
        />
    );
}

export const methodSchema = (view, variable) => ({
    type: 'string',
    required: true,
    view: Object.assign({}, view, { type: MethodView, choices: genChoices(variable) })
});
