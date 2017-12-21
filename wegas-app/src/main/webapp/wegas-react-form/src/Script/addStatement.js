import PropTypes from 'prop-types';
import React from 'react';
import { types } from 'recast';
import { css } from 'glamor';
import { RemoveStatementButton, AddStatementButton } from './Views/Button';
import Statement from './Views/Statement';

const removeButtonStyle = css({
    opacity: 0,
    display: 'inline-block',
    transition: 'opacity 300ms 300ms',
});

const removeContainerStyle = css({
    // borderLeft: 'solid 1px lightsteelblue',
    // marginTop: '2em',
    backgroundColor: '#f0f0ff',
    marginBottom: '4px',
    padding: '0 5px',
    [`:hover > .${removeButtonStyle}`]: {
        opacity: 1,
    },
});

export default function addStatement(Comp) {
    class AddStatement extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                code: props.code,
            };
        }
        componentWillReceiveProps(nextProps) {
            this.setState({
                code: nextProps.code,
            });
        }
        render() {
            return (
                <span>
                    <AddStatementButton
                        onClick={() => {
                            this.setState({
                                code: this.state.code.concat([
                                    types.builders.emptyStatement(),
                                ]),
                            });
                        }}
                        tooltip={
                            this.props.type === 'condition'
                                ? 'Add Condition'
                                : 'Add Impact'
                        }
                    />
                    <Comp {...this.props} code={this.state.code} />
                </span>
            );
        }
    }
    AddStatement.propTypes = {
        code: PropTypes.arrayOf(PropTypes.object),
        type: PropTypes.oneOf(['condition', 'getter']),
    };
    return AddStatement;
}
export const removeStatement = Comp => {
    function RemoveStatement(props) {
        return (
            <div className={removeContainerStyle}>
                <Statement>
                    <Comp {...props} />
                </Statement>
                <div className={removeButtonStyle}>
                    <RemoveStatementButton onClick={props.onRemove} />
                </div>
            </div>
        );
    }
    RemoveStatement.propTypes = {
        onRemove: PropTypes.func,
    };
    return RemoveStatement;
};
