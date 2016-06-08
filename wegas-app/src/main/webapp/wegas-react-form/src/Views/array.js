import React, { PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';

function ArrayWidget(props) {
    function renderChild(child, index) {
        return (<div>
            {child}
            <IconButton
                iconClassName="fa fa-minus"
                onClick={props.onChildRemove(index)}
            />
        </div>);
    }

    const style = {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingLeft: '30px',
        borderTop: props.view.title ? '1px solid lightgrey' : 'none'
    };
    const legendStyle = {
        textAlign: 'center'
    };
    const children = React.Children.map(props.children, renderChild);
    return (<fieldset
        className={props.view.className}
        style={style}
    >
        <legend style={legendStyle}>
            {props.view.title || props.editKey}
        </legend>
        {children}
        <IconButton
            iconClassName="fa fa-plus"
            onClick={props.onChildAdd}
        />
    </fieldset>);
}

ArrayWidget.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element),
    onChildRemove: PropTypes.func.isRequired,
    onChildAdd: PropTypes.func.isRequired
};
export default ArrayWidget;
