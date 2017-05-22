import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { css } from 'glamor';

const rootStyle = css({
    clear: 'both'
});

const borderTopStyle = css({
    borderTop: '1px solid #b3b3b3'
});

const errorStyle = css({
    color: 'red',
    fontSize: '80%',
    float: 'left'
});

const legendStyle = css({
    color: '#282',
    textAlign: 'center',
    padding: '0 5px'
});


function ObjectView(props) {
    return (
        <fieldset
            className={classNames(`${rootStyle}`,
                { [`${borderTopStyle}`]: props.view.label },
                props.view.className)}
        >
            <legend className={legendStyle}>
                {props.view.label}
            </legend>
            {props.children}
            {props.errorMessage.map(message => <div
                key={message}
                className={errorStyle}
            >
                {message}
            </div>
            )}
        </fieldset>
    );
}

ObjectView.propTypes = {
    children: PropTypes.node,
    view: PropTypes.shape({
        className: PropTypes.string,
        label: PropTypes.string,
    }),
    errorMessage: PropTypes.array,
    editKey: PropTypes.string,
};
export default ObjectView;
