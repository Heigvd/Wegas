import PropTypes from 'prop-types';
import React from 'react';
import { types } from 'recast';
/**
 * HOC single statement builder
 */
function singleStatement(Comp) {
    /**
     * Component
     * @param {{code:Object[], onChange:(AST:Object[])=>void}} props  Component's props
     */
    function SingleStatement(props) {
        const { code, onChange } = props;
        const stmt = code[0] || types.builders.emptyStatement();
        return (
            <Comp
                {...props}
                node={stmt}
                onChange={v => onChange([types.builders.expressionStatement(v)])}
            />
        );
    }
    SingleStatement.propTypes = {
        code: PropTypes.array,
        onChange: PropTypes.func
    };
    return SingleStatement;
}
export default singleStatement;
