import React from 'react';
import Form from 'jsoninput';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash-es';
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
    componentDidMount() {
        this.checkConst();
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.schema !== this.props.schema) {
            this.setState({ schema: argSchema(nextProps.schema) });
        }
    }
    shouldComponentUpdate(nextProps) {
        return (
            this.props.schema !== nextProps.schema ||
            this.props.entity !== nextProps.entity ||
            !!(
                nextProps.value &&
                this.props.value &&
                (nextProps.value.type !== this.props.value.type ||
                    nextProps.value.value !== this.props.value.value ||
                    nextProps.value.name !== this.props.value.name)
            )
        );
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
        const { value, onChange, entity } = this.props;
        const { schema } = this.state;
        const s = { ...schema, view: { ...schema.view, entity } };

        const val = matchSchema(value, schema)
            ? typeToValue(value, schema)
            : undefined;
        return (
            <div className={containerStyle}>
                <Form
                    schema={s}
                    value={val}
                    onChange={v => onChange(valueToType(v, this.props.schema))}
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
