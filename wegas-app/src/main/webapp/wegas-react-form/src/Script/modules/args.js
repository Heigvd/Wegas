import React from 'react';
import { types, print, parse, visit } from 'recast';
import Form from 'jsoninput';

const { builders: b } = types;
/**
 * Handle a Form's' schema for unknown datatypes
 * @param {{type:string}} schema The schema
 * @param {?=} entity optional object to merge into the schema
 * @returns {{type:string}} a corrected / increased schema
 */
export const argSchema = (schema, entity) => {
    const type = schema.type === 'identifier' ? 'string' : schema.type;
    return Object.assign({}, schema, {
        type,
        view: Object.assign({}, schema.view, {
            entity
        })
    });
};
/**
 * Convert a value to an AST node base on a type
 * @template T
 * @param {T=} value the optional value
 * @param {{type: string}} schema the schema containing the type
 * and
 * @returns {Object} AST node
 */
export function valueToType(value, schema) {
    if (value === undefined) {
        return b.identifier('undefined');
    }
    switch (schema.type) {
        case 'string':
        case 'number':
        case 'boolean':
            return b.literal(value);
        case 'identifier':
            return b.identifier(value);
        case 'array':
        case 'object': {
            const x = parse(`( ${JSON.stringify(value)} )`).program.body[0].expression;
            return x;
        }
        default:
            throw Error(`implement me ${schema.type}`);
    }
}

/**
 * Convert AST to value based on a type
 * @param {Object} value the AST node value
 * @param {{type:string}} schema value's jsonschema
 * @returns {?} The inferred value.
 */
export function typeToValue(value, schema) {
    const tmp = [];
    let tmpNum;
    if (!value || value.name === 'undefined') {
        return undefined;
    }
    switch (schema.type) {
        case 'string':
        case 'boolean':
            return value.value;
        case 'number':
            // handle negative values.
            visit(value, {
                visitUnaryExpression: function visitUnaryExpression(path) {
                    tmp.push(path.node.operator);
                    this.traverse(path);
                },
                visitLiteral: function visitLiteral(path) {
                    tmp.push(path.node.value);
                    return false;
                }
            });
            tmpNum = tmp.join('');
            return isNaN(tmpNum) ? tmpNum : Number(tmpNum);
        case 'identifier':
            return value.name;
        case 'array':
        case 'object':
            return Function(`"use strict";return ${print(value).code};`)(); // eslint-disable-line no-new-func
        default:
            throw Error(`implement me ${schema.type}`);
    }
}

/**
 * Check if a given AST matches it's schema
 * @param {Object} value The ast node
 * @param {{type:string}} schema The schema to check against
 */
export function matchSchema(value, schema) {
    const newVal = valueToType(typeToValue(value, schema), schema);
    return (
        value && (
            (
                newVal.type === value.type &&
                newVal.name === value.name &&
                newVal.value === value.value
            ) || (
                value.type === 'UnaryExpression' && newVal.type === 'Literal' &&
                newVal.name === value.name &&
                value.value === undefined
            )
        )
    );
}
/**
 * Create a Form for an AST node
 * @param {Object} astValue The AST node
 * @param {{type:string}} descriptor The schema for the given node
 * @param {function(Object):void} onChange Callback for a value change.
 * @param {?=} entity An optional entity to merge into schema's view
 * @param {string=} key An optional key for React. In case this form is in an array
 * @returns {JSX.Element} Form element
 */
export function renderForm(astValue, descriptor, onChange, entity, key) {
    // validate it : ref={n => n && n.validate()}
    return (
        <Form
            key={key}
            schema={argSchema(descriptor, entity)}
            value={
                matchSchema(astValue, descriptor)
                    ? typeToValue(astValue, descriptor)
                    : undefined
            }
            onChange={v => onChange(valueToType(v, descriptor))}
        />
    );
}
/**
 * Generate an array of forms for each function's arguments
 * @param {{arguments:{type:string}[]}} methodDescr a Wegas method descriptor
 * @param {Object[]} args An array of AST nodes
 * @param {function(Object[]):void} onChange Callback function receiving updated AST array
 * @param {?=} entity An optional entity to merge into each form schema's view
 * @returns {JSX.Element[]} An array of form elements.
 */
export function handleMethodArgs(methodDescr, args, onChange, entity) {
    if (!methodDescr) {
        return [];
    }
    const argDescr = methodDescr.arguments;
    const ret = argDescr.map((v, i) => args[i] || valueToType(undefined, v));

    // if (args.length !== argDescr.length) { // remove/create unknown arguments
    //     setTimeout(() => onChange(ret), 0); // delay to let react's render end.
    //     return [];
    // }
    // let changed = false;
    // ret.forEach((val, i) => {
    //     if (!matchSchema(val, argDescr[i])) {
    //         ret[i] = valueToType(undefined, argDescr[i]);
    //         changed = true;
    //     }
    // });
    // if (changed) {
    //     setTimeout(() => onChange(ret), 0); // delay to let react's render end.
    //     return [];
    // }
    return argDescr.map((a, i) => {
        const val = ret[i];
        return renderForm(
            val,
            a,
            v => {
                ret[i] = v;
                onChange(ret);
            },
            entity,
            i
        );
    });
}
