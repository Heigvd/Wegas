import React, { PropTypes } from 'react';
import { types } from 'recast';
import { RemoveStatementButton, AddStatementButton } from './Views/Button';
import Statement from './Views/Statement';

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
                                code: this.state.code.concat([types.builders.emptyStatement()])
                            });
                        } }
                        />
                </div>);
        }
    }
    AddStatement.propTypes = {
        code: PropTypes.arrayOf(PropTypes.object)
    };
    return AddStatement;
}
export const removeStatement = (Comp) => {
    function RemoveStatement(props) {
        return (
            <div>
                <RemoveStatementButton onClick={props.onRemove} />
                <Statement><Comp {...props} /></Statement>
            </div>
        );
    }
    RemoveStatement.propTypes = {
        onRemove: PropTypes.func
    };
    return RemoveStatement;
};
