import React from 'react';
import Form from 'jsoninput';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash-es';
import { argSchema, valueToType, typeToValue, matchSchema } from './args';
import { containerStyle } from '../Views/conditionImpactStyle';

export default class ArgFrom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            schema: argSchema(props.schema),
            value: typeToValue(props.value, props.schema),
        };
    }
    componentDidMount() {
        this.checkConst();
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.schema !== this.props.schema) {
            this.setState({
                schema: argSchema(nextProps.schema),
            });
        }
        const newValue = typeToValue(nextProps.value, nextProps.schema);
        if (
            this.props.schema !== nextProps.schema &&
            !matchSchema(nextProps.value, nextProps.schema)
        ) {
            setTimeout(() => nextProps.onChange(valueToType(undefined)), 10);
        } else {
            this.setState({
                value: newValue,
            });
        }
    }
    componentDidUpdate() {
        this.checkConst();
    }
    checkConst() {
        if (
            'const' in this.state.schema &&
            !isEqual(
                this.state.schema.const,
                typeToValue(this.props.value, this.props.schema)
            )
        ) {
            this.props.onChange(
                valueToType(this.state.schema.const, this.props.schema)
            );
        }
    }
    render() {
        const { onChange, entity } = this.props;
        const { schema, value } = this.state;
        const s = { ...schema, view: { ...schema.view, entity } };
        return (
            <div className={containerStyle}>
                <Form
                    schema={s}
                    value={value}
                    onChange={v => {
                        this.lastValue = v;
                        onChange(valueToType(v, this.props.schema));
                    }}
                />
            </div>
        );
    }
}
ArgFrom.propTypes = {
    schema: PropTypes.object.isRequired,
    entity: PropTypes.any,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
};
