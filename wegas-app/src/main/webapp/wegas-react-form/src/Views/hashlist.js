import React, { PropTypes } from 'react';
import ObjectView from './object';
import IconButton from 'material-ui/IconButton';
import TextField from 'material-ui/TextField';

const halfWidth = {
    display: 'inline-block',
    position: 'relative',
    width: '50%'
};
class HashlistView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newInputValue: ''
        };
        this.addChild = this.addChild.bind(this);
        this.onAdderChange = this.onAdderChange.bind(this);
    }
    onAdderChange(event) {
        this.setState({
            newInputValue: event.target.value
        });
    }
    addChild() {
        const newInputValue = this.refs.newInput.getValue();
        this.setState({
            newInputValue: ''
        });
        this.props.addKey(newInputValue);
        setTimeout(() => {
            this.refs[newInputValue].querySelector('input').focus();
        }, 20);
    }
    render() {
        const { addKey, removeKey, alterKey, children, ...restProps } = this.props;
        const newChildren = React.Children.map(children, child => {
            function remove() {
                removeKey(child.props.editKey);
            }

            function onKeyChange(event) {
                alterKey(child.props.editKey, event.target.value);
            }

            return (<div>
                <TextField
                    defaultValue={child.props.editKey}
                    style={halfWidth}
                    onBlur={onKeyChange}
                    floatingLabelText={this.props.view.keyLabel || 'Name'}
                />
                <div
                    style={halfWidth}
                    ref={child.props.editKey}
                >
                    {child}
                </div>
                <IconButton
                    iconClassName="fa fa-minus"
                    onClick={remove}
                />
            </div>);
        });

        return (<ObjectView {...restProps}>
            {newChildren}
            <TextField
                style={halfWidth}
                value={this.state.newInputValue}
                onChange={this.onAdderChange}
                floatingLabelText={this.props.view.keyLabel || 'Name'}
                ref="newInput"
            />
            <IconButton
                iconClassName="fa fa-plus"
                onClick={this.addChild}
            />
        </ObjectView>);
    }
}
HashlistView.propTypes = {
    addKey: PropTypes.func.isRequired,
    removeKey: PropTypes.func.isRequired,
    alterKey: PropTypes.func.isRequired,
    children: PropTypes.node,
    view: PropTypes.shape({
        keyLabel: PropTypes.string
    })
};
export default HashlistView;
