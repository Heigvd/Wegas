import PropTypes from 'prop-types';
import React from 'react';
import Select from '../select';
import { getY } from '../../index';

const choices = currentValue => () =>
    new Promise(resolve => {
        const gmId = getY().Wegas.Facade.GameModel.cache.get('currentGameModelId');
        getY().Wegas.Facade.GameModel.cache.sendRequest({
            request: `/${gmId}/FindAllFiredEvents`,
            on: {
                success: e => {
                    const events = e.response.entities;
                    if (events.indexOf(currentValue) < 0) {
                        resolve(events.concat(currentValue));
                    } else {
                        resolve(events);
                    }
                }
            }
        });
    });

function EventSelect(props) {
    return <Select {...props} view={{ ...props.view, choices: choices(props.value) }} />;
}
EventSelect.propTypes = {
    value: PropTypes.string,
    view: PropTypes.object
};
export default EventSelect;
