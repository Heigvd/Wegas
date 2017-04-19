import PropTypes from 'prop-types';
import React from 'react';
import { types } from 'recast';
import { RemoveStatementButton, AddStatementButton } from './Views/Button';
import Statement from './Views/Statement';
import styles from './Views/addStatement.css';

export default function addStatement(Comp) {
    class AddStatement extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                code: props.code
            };
        }
        componentWillReceiveProps(nextProps) {
            this.setState({
                code: nextProps.code
            });
        }
        render() {
            return (
                <div>
                    <Comp {...this.props} code={this.state.code} />
                    <AddStatementButton
                        onClick={() => {
                            this.setState({
                                code: this.state.code.concat([
                                    types.builders.emptyStatement()
                                ])
                            });
                        }}
                        label={
                            this.props.type === 'condition'
                                ? 'Condition'
                                : 'Impact'
                        }
                    />
                </div>
            );
        }
    }
    AddStatement.propTypes = {
        code: PropTypes.arrayOf(PropTypes.object),
        type: PropTypes.oneOf(['condition', 'getter'])
    };
    return AddStatement;
}
export const removeStatement = Comp => {
    function RemoveStatement(props) {
        return (
            <div className={styles.container}>
                <div className={styles.removeButton}>
                    <RemoveStatementButton onClick={props.onRemove} />
                </div>
                <Statement><Comp {...props} /></Statement>
            </div>
        );
    }
    RemoveStatement.propTypes = {
        onRemove: PropTypes.func
    };
    return RemoveStatement;
};
