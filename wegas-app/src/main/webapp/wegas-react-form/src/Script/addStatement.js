import React, { PropTypes } from 'react';
import { types } from 'recast';
import IconButton from 'material-ui/IconButton';

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
                        iconClassName="fa fa-plus"
                        onClick={() => {
                            this.setState({
                                code: this.state.code.concat([types.builders.emptyStatement()])
                            });
                        }}
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
                    iconClassName="fa fa-minus"
                    onClick={props.onRemove}
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
