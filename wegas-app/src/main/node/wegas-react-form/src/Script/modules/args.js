import React from 'react';
import { types, print, parse, visit } from 'recast';
import { isEqual, cloneDeep  } from 'lodash-es';
import ArgForm from './ArgForm';

const {builders: b, namedTypes: n} = types;
/**
 * Handle a Form's' schema for unknown datatypes, pass in an entity.
 * @param {{type:string}} schema The schema
 * @param {?=} entity optional object to merge into the schema
 * @returns {{type:string}} a corrected / increased schema
 */
export const argSchema = (schema, entity) => {
    const type = schema.type === 'identifier' ? 'string' : schema.type;
    return Object.assign({}, schema, {
        type,
        view: Object.assign({}, schema.view, {
            entity,
        }),
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
export function valueToAST(value, schema) {
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
        case 'object':
        {
            const x = parse(`( ${JSON.stringify(value)} )`).program.body[0]
                .expression;
            return x;
        }
        default:
            throw Error(`Unknown schema.type ${schema.type}`);
    }
}

/**
 * Convert AST to value based on a type
 * @param {Object} ast the AST node value
 * @param {{type:string}} schema value's jsonschema
 * @returns {?} The inferred value.
 */
export function astToValue(ast, schema) {
    const tmp = [];
    let tmpNum;
    if (!ast || ast.name === 'undefined') {
        return undefined;
    }
    switch (schema.type) {
        case 'string':
        case 'boolean':
            return ast.value;
        case 'number':
            // handle negative values.
            visit(ast, {
                visitNode() {
                    throw Error('Unhandled');
                },
                visitUnaryExpression: function visitUnaryExpression(path) {
                    tmp.push(path.node.operator);
                    this.traverse(path);
                },
                visitLiteral: function visitLiteral(path) {
                    tmp.push(path.node.value);
                    return false;
                },
            });
            tmpNum = tmp.join('');
            return Number.isNaN(Number(tmpNum)) ? tmpNum : Number(tmpNum);
        case 'identifier':
            return ast.name;
        case 'array':
        case 'object':
            // eslint-disable-next-line no-new-func
            tmpNum = Function(`"use strict";return ${print(ast).code};`)();
            return typeof tmpNum === 'object' ? tmpNum : undefined;
        default:
            throw Error(`Unknown schema.type ${schema.type}`);
    }
}

function isLiteralNumber(AST) {
    return n.Literal.check(AST) && typeof AST.value === 'number';
}
/**
 * Check if a given AST matches its schema
 * @param {Object} ast The ast node
 * @param {{type:string}} schema The schema to check against
 */
export function matchSchema(ast, schema) {
    // undefined matches everything
    if (n.Identifier.check(ast) && ast.name === 'undefined') {
        return true;
    }
    switch (schema.type) {
        case 'string':
        case 'boolean':
            // eslint-disable-next-line
            return n.Literal.check(ast) && typeof ast.value === schema.type;
        case 'number':
            return (
                isLiteralNumber(ast) ||
                (n.UnaryExpression.check(ast) &&
                    ['+', '-'].includes(ast.operator) &&
                    isLiteralNumber(ast.argument))
            );
        case 'array':
            return n.ArrayExpression.check(ast);
        case 'object':
            return n.ObjectExpression.check(ast);
        case 'identifier':
            return n.Identifier.check(ast);
        default:
            return false;
    }
}


export function getReadOnlySchema(args) {
    let clone = cloneDeep(args);
    _turnSchemaReadOnly(clone);
    return clone;
}
    
const _turnSchemaReadOnly = args =>{
    if (Array.isArray(args)){
        args.forEach(arg => {
            _turnSchemaReadOnly(arg);
        });
    } else {
        // object
        if (args && args.props && args.props.schema){
            args.props.schema.view = {
                ...args.props.schema.view,
                readOnly: true
            };
        }

        if (args.view){
            args.view.readOnly = true;
        }

        if (args && args.props && args.props.schema.type === "array"  && args.props.schema.items){
            for (let k  in args.props.schema.items){
                _turnSchemaReadOnly(args.props.schema.items[k]);
            }
        }

        if (args && args.props && args.props.schema.type === "object"  && args.props.schema.properties){
            for (let k  in args.props.schema.properties){
                _turnSchemaReadOnly(args.props.schema.properties[k]);
            }
        }
        
        if (args && args.type === "object"){
            if (args.additionalProperties && args.additionalProperties.view){
                args.additionalProperties.view = {
                    ...args.additionalProperties.view,
                    readOnly:true
                };
            }

            if (args.view){
                args.view.readOnly = true;
            }
        }
    }
    
    return args;
};
    
/**
 * Create a Form for an AST node
 * @param {Object} astValue The AST node
 * @param {{type:string}} descriptor The schema for the given node
 * @param {function(Object):void} onChange Callback for a value change.
 * @param {?=} entity An optional entity to merge into schema's view
 * @param {string=} key An optional key for React.
 * In case this form is in an array
 * @returns {JSX.Element} Form element
 */
export function renderForm(astValue, descriptor, onChange, entity, key) {
    // validate it : ref={n => n && n.validate()}
    return (
        <ArgForm
            value={astValue}
            entity={entity}
            schema={descriptor}
            onChange={onChange}
            key={key}
            />
    );
}
/**
 * Generate an array of forms for each function's arguments
 * @param {{arguments:{type:string}[]}} methodDescr a Wegas method descriptor
 * @param {Object[]} args An array of AST nodes
 * @param {function(Object[]):void} onChange Callback function receiving
 * updated AST array
 * @param {?=} entity An optional entity to merge into each form schema's view
 * @returns {JSX.Element[]} An array of form elements.
 */
export function handleMethodArgs(methodDescr, args, onChange, entity) {
    if (!methodDescr) {
        return [];
    }
    const argDescr = methodDescr.arguments;
    const ret = argDescr.map((v, i) => args[i] || valueToAST(undefined, v));

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
/**
 * Update an argument given a schema.
 * Force const or replace with default value if value does
 * not match a schema.
 * @param {*} value
 * @param {{const?:*, value?:*, type:string}} schema
 */
export function updateArgSchema(value, schema) {
    if (
        'const' in schema &&
        !isEqual(schema.const, astToValue(value, schema))
    ) {
        return valueToAST(schema.const, schema);
    } else if (!matchSchema(value, schema)) {
        return valueToAST(schema.value, schema);
    }
    return value;
}
