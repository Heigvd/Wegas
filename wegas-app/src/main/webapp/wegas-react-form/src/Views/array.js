import React, { PropTypes } from 'react';
import commonView from '../HOC/commonView';
import styles from '../css/array.css';
import IconButton from '../Components/IconButton.js';

const minusStyle = {
    float: 'left',
    marginTop: '12px'
};
const childStyle = {
    marginLeft: '48spx'
};
const legendStyle = {
    textAlign: 'center'
};
function ArrayWidget(props) {
    function renderChild(child, index) {
        return (
            <div
                style={{ clear: 'both' }}
                className={styles.liste}
            >
                <div
                    className={styles.liste2}
                >
                    <span
                        style={{ 'margin-right': '5px' }}
                    >
                        {child}
                    </span>
                    <div
                        className={styles.opacity}
                    >
                        <IconButton
                            icon="fa fa-trash"
                            tooltip="remove"
                            onClick={props.onChildRemove(index)}
                            grey
                        />
                    </div>
                </div>
            </div>);
    }

    const children = React.Children.map(props.children, renderChild);
    const valueLength = props.value ? props.value.length : 0;
    return (

        <div
            className={styles.label}
        >
            <span>
                {props.view.label}
            </span>
            {props.schema.maxItems > valueLength ? <IconButton
                icon="fa fa-plus"
                onClick={props.onChildAdd}
                tooltip="add"
            />:null}
            {children}
        </div>
        );
}

ArrayWidget.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element),
    onChildRemove: PropTypes.func.isRequired,
    onChildAdd: PropTypes.func.isRequired,
    view: PropTypes.object,
    value: PropTypes.array,
    schema: PropTypes.shape({
        minItems: PropTypes.number,
        maxItems: PropTypes.number
    }),
    editKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
export default commonView(ArrayWidget);
