import React, { PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import TextField from 'material-ui/TextField';
import ObjectView from './object';

const halfWidth = {
    display: 'inline-block',
    position: 'relative',
    width: '50%'
};
const minusStyle = {
    float: 'left',
    marginTop: '12px'
};
class HashlistView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newInputValue: ''
        };
        this.child = [];
        this.addChild = this.addChild.bind(this);
        this.onAdderChange = this.onAdderChange.bind(this);
    }
    onAdderChange(event) {
        this.setState({
            newInputValue: event.target.value
        });
    }
    addChild() {
        const newInputValue = this.newInput.getValue();
        this.setState({
            newInputValue: ''
        });
        this.props.addKey(newInputValue);
        setTimeout(() => {
            this.child[newInputValue].querySelector('input').focus();
        }, 20);
    }
    render() {
        const { removeKey, alterKey, children, ...restProps } = this.props;
        const newChildren = React.Children.map(children, child => {
            function remove() {
                removeKey(child.props.editKey);
            }

            function onKeyChange(event) {
                alterKey(child.props.editKey, event.target.value);
            }

            return (<div>
                <IconButton
                    iconClassName="fa fa-minus"
                    onClick={remove}
                    style={minusStyle}
                />
                <div style={{ marginLeft: '48px', position: 'relative' }}>
                    <TextField
                        defaultValue={child.props.editKey}
                        style={halfWidth}
                        onBlur={onKeyChange}
                        floatingLabelText={this.props.view.keyLabel || 'Name'}
                    />
                    <div
                        style={halfWidth}
                        ref={node => { this.child[child.props.editKey] = node; }}
                    >
                        {child}
                    </div>
                </div>
            </div>);
        });

        return (<ObjectView {...restProps}>
            {newChildren}
            <TextField
                style={halfWidth}
                value={this.state.newInputValue}
                onChange={this.onAdderChange}
                floatingLabelText={this.props.view.keyLabel || 'Name'}
                ref={node => { this.newInput = node; }}
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
