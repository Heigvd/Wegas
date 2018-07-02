import PropTypes from 'prop-types';
import React from 'react';
import Form from 'jsoninput';

const BINARYOPERATORS = [{
    value: '===',
    label: 'equals'
}, {
    value: '!==',
    label: 'is different from'
}];
const NUMBERBINARYOPERATORS = BINARYOPERATORS.concat([{
    value: '>',
    label: 'is greater than'
}, {
    value: '<',
    label: 'is smaller than'
}, {
    value: '>=',
    label: 'is greater or equal to'
}, {
    value: '<=',
    label: 'is smaller or equal to'
}]);
/**
 * Binary operator form.
 */
function ConditionOperator({ type, operator, onChange, readOnly }) {
    const choices = type === 'number' ? NUMBERBINARYOPERATORS : BINARYOPERATORS;
    const schema = {
        type: 'string',
        errored: v => choices.some(c => c.value === v),
        view: {
            type: 'select',
            choices,
            readOnly: readOnly
        }
    };
    return (
        <Form
            schema={schema}
            value={operator}
            onChange={onChange}
        />
    );
}
ConditionOperator.propTypes = {
    type: PropTypes.oneOf(['number', 'boolean', 'string']).isRequired,
    operator: PropTypes.string,
    onChange: PropTypes.func.isRequired
};
export default ConditionOperator;
