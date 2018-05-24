import React from 'react';
import Form from 'jsoninput';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash-es';
import { argSchema, valueToAST, astToValue } from './args';

export default class ArgFrom extends React.Component {
    static getDerivedStateFromProps(nextProps) {
        return {
            schema: argSchema(nextProps.schema),
            value: astToValue(nextProps.value, nextProps.schema),
        };
    }
    constructor(props) {
        super(props);
        this.state = {};
        this.onChange = this.onChange.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !isEqual(this.state.schema, nextState.schema) ||
            !isEqual(this.state.value, nextState.value) ||
            this.props.entity !== nextProps.entity
        );
    }
    onChange(value) {
        this.props.onChange(valueToAST(value, this.props.schema));
    }
    render() {
        const { entity } = this.props;
        const { schema, value } = this.state;
        const s = { ...schema, view: { ...schema.view, entity } };
        return <Form schema={s} value={value} onChange={this.onChange} />;
    }
}
ArgFrom.propTypes = {
    schema: PropTypes.object.isRequired,
    entity: PropTypes.any,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
};
