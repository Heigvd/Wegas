import React, { PropTypes } from 'react';
import commonView from '../HOC/commonView';
import styles from '../css/array.css';
import IconButton from '../Components/IconButton';

function ArrayWidget(props) {
    const valueLength = props.value ? props.value.length : 0;
    const { maxItems = Infinity, minItems = 0 } = props.schema;
    function renderChild(child, index) {
        return (
            <div
                style={{ clear: 'both' }}
                className={styles.liste}
            >
                <div
                    className={styles.liste2}
                >
                    <span>
                        {child}
                    </span>
                    <div
                        className={styles.opacity}
                    >
                        {minItems < valueLength ? <IconButton
                            icon="fa fa-trash"
                            tooltip="remove"
                            onClick={props.onChildRemove(index)}
                            grey
                        /> : null}
                    </div>
                </div>
            </div>);
    }

    const children = React.Children.map(props.children, renderChild);
    return (

        <div>
            {maxItems > valueLength ? <IconButton
                icon="fa fa-plus"
                onClick={props.onChildAdd}
                tooltip="add"
            /> : null}
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
    })
};
export default commonView(ArrayWidget);
