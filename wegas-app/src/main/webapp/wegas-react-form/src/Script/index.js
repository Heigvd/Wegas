import parsed from './parser';
import scriptObject from './scriptObject';
import singleStatement from './singleStatement';
import multipleStatement from './multipleStatements';
import VariableMethod from './modules/variableMethod';
import Variable from './modules/variable';

const VariableStatement = scriptObject(parsed(singleStatement(Variable)));
const MultiVariableMethod = scriptObject(parsed(multipleStatement(VariableMethod)));

export {
    VariableStatement,
    MultiVariableMethod
};
