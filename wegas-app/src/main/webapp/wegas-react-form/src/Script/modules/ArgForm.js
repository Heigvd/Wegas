import React from 'react';
import Form from 'jsoninput';
import PropTypes from 'prop-types';
import { argSchema, valueToType, typeToValue, matchSchema } from './args';
import { containerStyle } from '../Views/conditionImpactStyle';
import { types } from 'recast';

const b = types.builders;

export default class ArgFrom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            schema: argSchema(props.schema),
        };
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.schema !== this.props.schema) {
            this.setState({ schema: argSchema(nextProps.schema) });
        }
    }
    shouldComponentUpdate(nextProps) {
        return (
            this.props.schema !== nextProps.schema ||
            !!(
                nextProps.value &&
                this.props.value &&
                (nextProps.value.type !== this.props.value.type ||
                    nextProps.value.value !== this.props.value.value ||
                    nextProps.value.name !== this.props.value.name)
            )
        );
    }
    render() {
        const { value, onChange } = this.props;
        const { schema } = this.state;
        // Reduce unary minus operator to a simple literal to make matching work:
        let negativeValue;
        if (
            value &&
            value.type === 'UnaryExpression' &&
            value.operator === '-' &&
            value.argument.type === 'Literal'
        ) {
            negativeValue = b.literal(-value.argument.value);
        }
        const val = negativeValue || value || valueToType(undefined, schema);
        return (
            <div className={containerStyle}>
                <Form
                    schema={schema}
                    value={
                        matchSchema(val, schema)
                            ? typeToValue(val, schema)
                            : undefined
                    }
                    onChange={v => onChange(valueToType(v, this.props.schema))}
                />
            </div>
        );
    }
}
ArgFrom.propTypes = {
    schema: PropTypes.object.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
};
