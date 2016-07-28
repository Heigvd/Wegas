import React, { PropTypes } from 'react';
import { types } from 'recast';
import IconButton from 'material-ui/IconButton';

export default function addStatement(fn) {
    return Comp => {
        const DecoratedComp = fn(Comp);
        class NewStatement extends React.Component {
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
                        <DecoratedComp {...this.props} code={this.state.code} />
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
        NewStatement.propTypes = {
            code: PropTypes.arrayOf(PropTypes.object)
        };
        return NewStatement;
    };
}
