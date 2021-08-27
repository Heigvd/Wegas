import { parse, types } from 'recast';
import { extractMethod, methodDescriptor } from './modules/method';
import { methodDescriptor as globalMethodDescriptor } from './modules/globalMethod';
import { getY } from '../index';

const { visit } = types;
/**
 * All Validators must match
 * @param {boolean} initValue init value
 * @param {(...args:*[]) => boolean} fn function which should throw on validation error.
 * Explicitly return true to stop validation.
 */
function combineValidators(...fn) {
    return function g(...args) {
        return fn.some(f => f(...args));
    };
}
/**
 * validation for descr.const
 * @param {*} argument
 * @param {*} descr
 */
function constantValidator(argument, descr) {
    if (descr.const) {
        if (argument.type === 'Identifier' && argument.name !== descr.const) {
            throw Error(`does not match its value of ${descr.const}`);
        } else if (
            argument.type === 'Literal' &&
            argument.value !== descr.const
        ) {
            throw Error(`does not match its value of '${descr.const}'`);
        }
    }
    return true;
}
/**
 * validation for descr.required
 * @param {*} argument
 * @param {*} descr
 */
function requiredCheck(argument, descr) {
    if (descr.required) {
        if (
            argument === undefined ||
            (argument.type === 'Identifier' && argument.name === 'undefined')
        ) {
            throw Error('is required');
        }
    }
    return (
        argument === undefined ||
        (argument.name === 'undefined' && argument.type === 'Identifier')
    );
}
const validators = {
    identifier: combineValidators(
        requiredCheck,
        argument => {
            if (!argument || argument.type === 'Identifier') {
                return false;
            }
            throw Error('is not of type identifier');
        },
        constantValidator
    ),
    number: combineValidators(
        requiredCheck,
        argument => {
            if (
                !argument ||
                ['UnaryExpression', 'BinaryExpression'].includes(
                    argument.type
                ) ||
                (argument.type === 'Literal' &&
                    typeof argument.value === 'number')
            ) {
                return false;
            }
            throw Error('is not of type number');
        },
        constantValidator
    ),
    string: combineValidators(
        requiredCheck,
        argument => {
            if (
                !argument ||
                argument.type === 'BinaryExpression' || // concat string?
                (argument.type === 'Literal' &&
                    typeof argument.value === 'string')
            ) {
                return false;
            }
            throw Error('is not of type string');
        },
        constantValidator
    ),
};
function check(code) {
    const ast = parse(code);
    const errors = [];
    visit(ast, {
        visitCallExpression(path) {
            const descr = extractMethod(path.node);
            // console.log(descr);
            /**
             * @type {{
             *   label?:string,
             *   arguments:any[],
             *   className?:string,
             *   returns?:string
             * } | undefined}
             */
            let methodDescr;
            if (descr.global) {
                methodDescr = globalMethodDescriptor(
                    descr.member,
                    descr.method
                );
            } else {
                methodDescr = methodDescriptor(descr.variable, descr.method);
                if (!methodDescr) {
                    if (
                        getY().Wegas.Facade.Variable.cache.find(
                            'name',
                            descr.variable
                        ) == null
                    ) {
                        errors.push(`Variable '${descr.variable}' not found`);
                    } else if (descr.method === null) {
                        errors.push(
                            'You are allowed to use methods only'
                        );
                    } else if (descr.method !== false) {
                        errors.push(
                            `Method '${descr.method}' not found on variable '${
                                descr.variable
                            }'`
                        );
                    }
                }
            }
            // console.log(methodDescr);
            // Method is defined.
            if (methodDescr) {
                methodDescr.arguments.forEach((a, i) => {
                    const argument = descr.args[i];
                    if (validators[a.type]) {
                        try {
                            validators[a.type](argument, a);
                        } catch (e) {
                            errors.push(
                                `${descr.member || descr.variable}.${
                                    descr.method
                                }: parameter ${
                                    a.view && a.view.label
                                        ? a.view.label
                                        : `#${i}`
                                } ${e.message}`
                            );
                        }
                    }
                });
            }

            return true;
        },
    });
    return errors;
}

export default check;

/*
 * Ugly way to register it. This is to avoid having to load this piece
 * of code asynchronously and thus having a promise as a validator which is
 * not possible as of now.
 * This means this function will be available only once the Form is loaded,
 * which is when this is needed.
 */
/**
 * Try to parse given code.
 * @param {string} code code to parse.
 * @returns {string} empty string if no error occurs. Failed message else.
 */
getY().Wegas.RForm.Script.validate = function parser(code) {
    try {
        parse(code);
    } catch (e) {
        return 'Failed to parse code';
    }
    return '';
};
