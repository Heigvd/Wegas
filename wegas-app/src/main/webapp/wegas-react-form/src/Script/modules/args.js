import React from 'react';
import { types, print, parse } from 'recast';
import Container from 'jsoninput';
import { getY } from '../../index';

const Y = getY();
const { builders: b } = types;
// export function ArgView({ view, onChange, value, schema }) {
//     const type = value.type;
//     const val = value.name || value.value;
//     console.log(schema);
//     return (
//         <input
//             value={val}
//             onChange={
//                 event =>
//                     onChange(b[type.charAt(0).toLowerCase() + type.slice(1)](event.target.value))
//             }
//         />
//     );
// }
const argSchema = (schema, variable) => {
    const type = schema.type === 'identifier' ? 'string' : schema.type;
    return Object.assign({}, schema, {
        type,
        view: Object.assign({}, schema.view, { entity: variable })
    });
};
function valueToType(v, schema) {
    const val = v === undefined ? schema.value : v;
    if (val === undefined) {
        return b.identifier('undefined');
    }
    switch (schema.type) {
    case 'string':
    case 'number':
    case 'boolean':
        return b.literal(val);
    case 'identifier':
        return b.identifier(val);
    case 'array':
    case 'object': {
        const x = parse(JSON.stringify(val)).program.body[0].expression;
        return x;
    }
    default:
        throw Error(`implement me ${schema.type}`);
    }
}
function typeToValue(v, schema) {
    if (!v || v.name === 'undefined') {
        return undefined;
    }
    // return print(v).code;
    switch (schema.type) {
    case 'string':
    case 'number':
    case 'boolean':
        // return v.value;
        return print(v).code; // handle negative values.
    case 'identifier':
        return v.name;
    case 'array':
    case 'object':
        return Function(`return ${print(v).code};`)(); // eslint-disable-line no-new-func
    default:
        throw Error(`implement me '${schema.type}'`);
    }
}

function handleArgs(variable, method, args, onChange) {
    const methodDescr = Y.Wegas.Facade.Variable.cache.find('name', variable)
        .getMethodCfgs()[method];
    if (!methodDescr) {
        return [];
    }
    const argDescr = methodDescr.arguments;
    const ret = argDescr.map((v, i) => args[i] || valueToType(undefined, v));

    if (args.length !== argDescr.length) { // remove/create unknown arguments
        setTimeout(() => onChange(ret), 0);
        return [];
    }
    return argDescr.map((a, i) => {
        const val = ret[i];
        return (
            <Container
                key={`arg${i}`}
                schema={argSchema(a, variable)}
                value={typeToValue(val, a)}
                onChange={v => {
                    ret[i] = valueToType(v, a);
                    setTimeout(() => onChange(ret), 0);
                }}
            />
        );
    });
}
export {
    handleArgs,
    valueToType,
    typeToValue
};
