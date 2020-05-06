import PropTypes from 'prop-types';
import React from 'react';
import Select from '../select';
import { getY } from '../../index';

const getLabel = (level, label, id) => `${'\u00a0'.repeat(level * 2)} ${label || `Unnamed ${id}`}`;

const genTree = (folder, level) => {
    const items = [];

    folder.items.forEach(item => {
        if (item['@class'] === 'Folder') {
            items.push({
                value: item.id,
                label: getLabel(level, item.name, 'Folder'),
                disabled: true
            });
            items.push(...genTree(item, level + 1));
        } else if (item['@class'] === 'Page') {
            items.push({
                value: item.id,
                label: getLabel(level, item.name, item.id)
            });
        }
    });
    return items;
};

const choices = () => new Promise(resolve => {
    getY().Wegas.Facade.Page.cache.getIndex(index => resolve(genTree(index.root, 0)));
});

function PageSelect(props) {
    return <Select {...props} view={{...props.view, choices}} />;
}
PageSelect.propTypes = {
    view: PropTypes.object,
};
export default PageSelect;
