import PropTypes from 'prop-types';
import React from 'react';
import Select from '../select';
import { getY } from '../../index';

function genSpaces(nb) {
    let i;
    let ret = '';
    for (i = 0; i < nb; i += 1) {
        ret += '\u00a0\u00a0\u00a0'; // 3 whitespaces
    }
    return ret;
}
function genChoices(items, level, maxLevel, classFilter, selectable) {
    const enableFolder = classFilter.indexOf('ListDescriptor') > -1;
    let ret = [];
    if (level <= maxLevel) {
        items.forEach(i => {
            if (i.get('@class') === 'ListDescriptor' ||
                i.get('@class') === 'WhQuestionDescriptor') {
                const newItems = genChoices(
                    i.get('items'),
                    level + 1,
                    maxLevel,
                    classFilter,
                    selectable
                );
                if (newItems.length > 0 || enableFolder) {
                    ret.push({
                        label: genSpaces(level) + i.getEditorLabel(),
                        value: i.get('name'),
                        children: newItems,
                        disabled:
                            !enableFolder ||
                            (selectable && selectable.indexOf(level) === -1),
                    });
                    ret = ret.concat(newItems);
                }
            } else if (
                !classFilter.length ||
                classFilter.indexOf(i.get('@class')) !== -1
            ) {
                ret.push({
                    label: genSpaces(level) + i.getEditorLabel(),
                    value: i.get('name'),
                    disabled: selectable && selectable.indexOf(level) === -1,
                });
            }
        });
    }
    return ret;
}
function FlatVariableSelect({
    view: {
        maxLevel = Infinity,
        root = null,
        classFilter = [],
        selectableLevels,
        ...restView
    } = {},
    ...rest
}) {
    const filter = Array.isArray(classFilter) ? classFilter : [classFilter];
    const Y = getY();
    let items;
    if (root) {
        if (!Array.isArray(root)) {
            items = [Y.Wegas.Facade.Variable.cache.find('name', root)];
        } else {
            items = root.map(item =>
                Y.Wegas.Facade.Variable.cache.find('name', item)
            );
        }
    } else {
        items = Y.Wegas.Facade.GameModel.cache
            .getCurrentGameModel()
            .get('items');
    }
    return (
        <Select
            {...rest}
            view={{
                ...restView,
                choices: genChoices(
                    items,
                    0,
                    maxLevel,
                    filter,
                    selectableLevels
                ),
            }}
        />
    );
}
FlatVariableSelect.propTypes = {
    view: PropTypes.shape({
        maxLevel: PropTypes.number,
        root: PropTypes.string,
        classFilter: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.string),
            PropTypes.string,
        ]),
        selectableLevels: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
};
export default FlatVariableSelect;
