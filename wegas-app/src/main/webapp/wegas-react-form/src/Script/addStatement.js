import React, { PropTypes } from 'react';
import { types } from 'recast';
import IconButton from '../Components/IconButton';

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
                    <IconButton
                        onClick={() => {
                            this.setState({
                                code: this.state.code.concat([types.builders.emptyStatement()])
                            });
                        }}
                        iconColor="#9DC06F"
                        icon="fa fa-plus"
                        tooltip="add"
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
                <IconButton
                    icon="fa fa-minus"
                    onClick={props.onRemove}
                    tooltip="remove"
                    iconColor="darkred"
                />
                <Comp {...props} />
            </div>
        );
    }
    RemoveStatement.propTypes = {
        onRemove: PropTypes.func
    };
    return RemoveStatement;
};
