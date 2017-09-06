import PropTypes from 'prop-types';
import React from 'react';
import { types } from 'recast';
import { RemoveStatementButton, AddStatementButton } from './Views/Button';
import Statement from './Views/Statement';
import {css} from 'glamor';

const removeButtonStyle = css({
    label: 'addStatement-removeButtonStyle',
    opacity: 0,
    marginTop: '8px',
    verticalAlign: 'top',
    paddingRight: '5px',
    display: 'inline-block',
    transition: 'opacity 300ms 300ms'
});

const removeContainerStyle = css({
    label: 'addStatement-removeContainerStyle',
    // borderLeft: 'solid 1px lightsteelblue',
    // marginTop: '2em',
    backgroundColor: '#f0f0ff',
    marginBottom: '4px',
    ':hover *' : {
        opacity: 1
    }
});

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
            <div className={removeContainerStyle}>
                <Statement><Comp {...props} /></Statement>
                <div className={removeButtonStyle}>
                    <RemoveStatementButton onClick={props.onRemove} />
                </div>
            </div>
        );
    }
    RemoveStatement.propTypes = {
        onRemove: PropTypes.func
    };
    return RemoveStatement;
};
