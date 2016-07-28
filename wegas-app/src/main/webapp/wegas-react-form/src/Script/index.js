import parsed from './parser';
import scriptObject from './scriptObject';
import singleStatement from './singleStatement';
import multipleStatement from './multipleStatements';
import VariableMethod from './modules/VariableMethod';
import VariableCondition from './modules/VariableCondition';
import Variable from './modules/variable';
import condition from './condition';

const VariableStatement = scriptObject(parsed(singleStatement(Variable)));
const MultiVariableMethod = scriptObject(parsed(multipleStatement(VariableMethod)));
const MultiVariableCondition = scriptObject(
    parsed(
        condition(
            multipleStatement(VariableCondition)
        )
    )
);

export {
    VariableStatement,
    MultiVariableMethod,
    MultiVariableCondition
};
