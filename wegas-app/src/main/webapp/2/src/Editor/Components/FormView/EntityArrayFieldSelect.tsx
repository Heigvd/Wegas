import * as React from 'react';
import Select from './Select';
import {WidgetProps} from 'jsoninput/typings/types';
import {LabeledView} from './labeled';
import {CommonView} from './commonView';
import * as VariableDescriptor from '../../../data/selectors/VariableDescriptor'
import {getInstance} from '../../../data/methods/VariableDescriptor';

interface IName {
    values: string[],
    separator: string
}

interface IEntityArrayFieldSelectProps extends WidgetProps.BaseProps {
    view: {
        returnAttr: string,
        scope: 'instance' | string
        field: string,
        entity: string,
        name: IName
    } & CommonView & LabeledView;
}



function optionNameToString(result: any, name: IName) {
    const separator = name ? name.separator || ',' : ',';
    if (!name || !name.values || name.values.length <= 0) {
        return 'undefined';
    }
    return name.values.map(v => result[v]).join(separator);
}


function EntityArrayFieldSelect(
    props: IEntityArrayFieldSelectProps
) {
    const {field, returnAttr, scope, entity, name, ...restView} = props.view;

    const computedEntity = VariableDescriptor.first("name", entity);
    if (!computedEntity) {
        return null;
    }

    const results: unknown = scope !== 'instance' ?
        computedEntity[field] as unknown  :
        getInstance(computedEntity)[field] as unknown;

    if (results == null) {
        return null;
    }

    let aResults: Object[];
    if (typeof results === 'object' && results !== null) {
        aResults = Object.values(results);
    } else if (Array.isArray(results)) {
        aResults = results;
    } else {
        return null;
    }

    const choices = aResults.map(r => ({
        value: r[returnAttr || 'name'],
        label: optionNameToString(r, name)
    }));
    return <Select {...props} view={{...restView, choices}} />;
}

export default EntityArrayFieldSelect;
