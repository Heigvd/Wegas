import React from 'react';
import Form from 'jsoninput';
import PropTypes from 'prop-types';
import { argSchema, valueToType, typeToValue, matchSchema } from './args';
import { containerStyle } from '../Views/conditionImpactStyle';

export default class ArgFrom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            schema: argSchema(props.schema)
        };
    }
    shouldComponentUpdate(nextProps) {
        return nextProps.value !== this.props.value;
    }
    render() {
        const { value, onChange } = this.props;
        const { schema } = this.state;
        const val = value || valueToType(undefined, schema);
        return (
            <div className={containerStyle}>
                <Form
                    schema={schema}
                    value={
                        matchSchema(val, schema)
                            ? typeToValue(val, schema)
                            : undefined
                    }
                    onChange={v => onChange(valueToType(v, schema))}
                />
            </div>
        );
    }
}
ArgFrom.propTypes = {
    schema: PropTypes.object.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired
};
