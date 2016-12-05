import parsed from './parser';
import scriptObject from './scriptObject';
import singleStatement from './singleStatement';
import multipleStatement from './multipleStatements';
import Impact from './modules/Impact';
import Condition from './modules/Condition';
import Variable from './modules/Variable';
import condition from './condition';
import { register } from './modules/globalMethod';

const VariableStatement = scriptObject(parsed(singleStatement(Variable)));
const MultiVariableMethod = scriptObject(parsed(multipleStatement(Impact)));
const MultiVariableCondition = scriptObject(
    parsed(
        condition(
            multipleStatement(Condition)
        )
    )
);

export {
    VariableStatement,
    MultiVariableMethod,
    MultiVariableCondition,
    register
};
