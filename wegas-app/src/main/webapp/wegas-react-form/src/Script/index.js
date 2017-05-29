import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import parsed from './parser';
import scriptObject from './scriptObject';
import singleStatement from './singleStatement';
import multipleStatement from './multipleStatements';
import Impact from './modules/Impact';
import Condition from './modules/Condition';
import Variable from './modules/Variable';
import condition from './condition';
import { register } from './modules/globalMethod';
import statefulScript from './statefulScript';

const VariableStatement = scriptObject(parsed(singleStatement(Variable)));
const MultiVariableMethod = scriptObject(parsed(multipleStatement(Impact)));
const MultiVariableCondition = scriptObject(
    parsed(
        condition(
            multipleStatement(Condition)
        )
    )
);
// Using Script edition outside form.
function scriptRenderer(Component) {
    return (props, container) => {
        const comp = render(<Component {...props} />, container);
        return {
            validate: function validate() { return comp.validate(); },
            getValue: function getValue() { return comp.state.value; },
            destroy: function destroy() {
                unmountComponentAtNode(container);
            }
        };
    };
}

const IndependantMultiVariableMethod = scriptRenderer(statefulScript(MultiVariableMethod));
const IndependantMultiVariableCondition = scriptRenderer(statefulScript(MultiVariableCondition));
const IndependantVariableStatement = scriptRenderer(statefulScript(VariableStatement));

export {
    VariableStatement,
    MultiVariableMethod,
    MultiVariableCondition,
    register,
    IndependantMultiVariableCondition,
    IndependantMultiVariableMethod,
    IndependantVariableStatement
};
