import PropTypes from 'prop-types';
import React from 'react';
import Select from '../select';
import { getY } from '../../index';

function optionNameToString(result, name) {
    const separator = name ? name.separator || ',' : ',';
    if (!name || !name.values || name.values.length <= 0) {
        return ['undefined'];
    }
    return name.values.map((v, i) => {
        if (name.mapFn && name.mapFn[i]) {
            return name.mapFn[i](result.get(v), getY());
        } else {
            return result.get(v);
        }
    }).join(separator);
}
function EntityArrayFieldSelect(props) {
    const Y = getY();
    const context = props.context || {};
    const { field, returnAttr, scope, name, ...restView } = props.view;
    const computedEntity = context.entity
        ? Y.Wegas.Facade.Variable.cache.find('name', context.entity)
        : Y.Plugin.EditEntityAction.currentEntity;
    let results;
    if (scope !== 'instance') {
        results = computedEntity.get(field);
    } else {
        results = computedEntity.getInstance().get(field);
    }
    if (results == null) {
        return null;
    }
    if (typeof results === 'object') {
        results = Object.values(results);
    }
    const choices = results.map(r => ({
        value: r && r.get ? r.get(returnAttr || 'name') : r,
        label: r && r.get ? r.getEditorLabel() || optionNameToString(r, name) : r,
    }));
    return <Select {...props} view={{ ...restView, choices }} />;
}

EntityArrayFieldSelect.propTypes = {
    context: PropTypes.shape({
        entity: PropTypes.string
    }),
    view: PropTypes.shape({
        field: PropTypes.string.isRequired,
        returnAttr: PropTypes.string.isRequired,
        scope: PropTypes.oneOf(['instance']),
        name: PropTypes.shape({
            values: PropTypes.arrayOf(PropTypes.string),
            mapFn: PropTypes.arrayOf(PropTypes.func),
            separator: PropTypes.string,
        }),
    }).isRequired,
};
export default EntityArrayFieldSelect;
