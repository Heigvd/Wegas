import React from 'react';
import Container from 'jsoninput';

const BINARYOPERATORS = [{
    value: '===',
    label: 'equals'
}, {
    value: '!==',
    label: 'is different than'
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
function ConditionOperator({ type, operator, onChange }) {
    const choices = type === 'number' ? NUMBERBINARYOPERATORS : BINARYOPERATORS;
    const schema = {
        type: 'string',
        errored: v => choices.some(c => c.value === v),
        view: {
            type: 'select',
            choices
        }
    };
    return (
        <Container
            schema={schema}
            value={operator}
            onChange={onChange}
        />
    );
}
export default ConditionOperator;
