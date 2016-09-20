import React, { PropTypes } from 'react';
import styles from '../css/array.css';
import IconButton from '../Components/IconButton.js';

const minusStyle = {
    float: 'left',
    marginTop: '12px'
};
const childStyle = {
    marginLeft: '48px'
};
const legendStyle = {
    textAlign: 'center'
};
function ArrayWidget(props) {
    function renderChild(child, index) {
        return (<div style={{ clear: 'both' }}>
            <IconButton
                iconColor="darkred"
                icon="fa fa-minus"
                tooltip="remove"
                onClick={props.onChildRemove(index)}
            />
            <div style={childStyle}>{child}</div>
        </div>);
    }

    const style = {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingLeft: '3px',
        borderTop: props.view.label ? '1px solid lightgrey' : 'none'
    };
    const children = React.Children.map(props.children, renderChild);
    return (

        <div
            className={styles.label}
        >
            <span>
                {props.view.label || props.editKey}
            </span>
            <IconButton
                iconColor="#9DC06F"
                icon="fa fa-plus"
                onClick={props.onChildAdd}
                tooltip="add"
            />
        </div>
        );
}

ArrayWidget.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element),
    onChildRemove: PropTypes.func.isRequired,
    onChildAdd: PropTypes.func.isRequired,
    view: PropTypes.object,
    editKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
export default ArrayWidget;
