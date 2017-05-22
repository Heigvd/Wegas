import PropTypes from 'prop-types';
import React from 'react';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import { css } from 'glamor';
import FormStyles from './form-styles';
import IconButton from '../Components/IconButton';

const arrayContainerStyle = css({
    '& label': {
        display: 'inline-block',
    }
});

const arrayStyle = css({
    display: 'inline'
});

const hiddenStyle = css({
    opacity: 0,
    fontSize: '18px',
});

const listElementContainerStyle = css({
    clear: 'both',
    ':hover *': {
        opacity: 1,
        transition: 'opacity 2s'
    }
});

const listElementStyle = css({
    // Reduce vertical space between array elements:
    '& div': {
        marginTop: 0
    }
});

const inlinePlusStyle = css({
    fontSize: '18px',
    verticalAlign: '-1px'
});

function ArrayWidget(props) {
    const valueLength = props.value ? props.value.length : 0;
    const { maxItems = Infinity, minItems = 0 } = props.schema;
    function renderChild(child, index) {
        return (
                <div className={listElementContainerStyle}>
                    <span className={listElementStyle}>
                        {child}
                    </span>
                    <span className={hiddenStyle}>
                        {minItems < valueLength
                            ? <IconButton
                                icon="fa fa-trash"
                                tooltip="Remove"
                                onClick={() => props.onChildRemove(index)}
                                grey
                            />
                            : null}
                    </span>
                </div>
        );
    }

    const children = React.Children.map(props.children, renderChild);
    return (
        <div className={arrayStyle}>
            {maxItems > valueLength
                ? <IconButton
                    className={`${inlinePlusStyle}`}
                    icon="fa fa-plus-circle"
                    onClick={props.onChildAdd}
                    tooltip="Add element"
                />
                : null}
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
export default commonView(labeled(ArrayWidget, `${arrayContainerStyle}`));
