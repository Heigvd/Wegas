import PropTypes from 'prop-types';
import React from 'react';
import Select from '../select';
import { getY } from '../../index';

const choices = () =>
    new Promise(resolve => {
        getY().Wegas.Facade.Page.cache.getIndex(index =>
            resolve(
                index.map(page => ({
                    value: page.id,
                    label: page.name || `Unnamed (${page.id})`,
                }))
            )
        );
    });

function PageSelect(props) {
    return <Select {...props} view={{ ...props.view, choices }} />;
}
PageSelect.propTypes = {
    view: PropTypes.object,
};
export default PageSelect;
