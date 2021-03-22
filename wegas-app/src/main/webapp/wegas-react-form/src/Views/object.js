import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { css } from 'glamor';
import FormStyles from './form-styles';

const rootStyle = css({
    clear: 'both',
});

const borderTopStyle = css({
    borderTop: '1px solid #b3b3b3',
});

const errorStyle = css({
    color: 'red',
    fontSize: '80%',
    float: 'left',
});

const legendStyle = css({
    color: FormStyles.labelColor,
    textAlign: 'center',
    padding: '0 12px',
    fontSize: FormStyles.labelFontSize,
    fontFamily: FormStyles.labelFontFamily,
});

function ObjectView(props) {
    const label = props.view.label === true ? props.editKey : props.view.label;
    return (
        <div>
            <fieldset
                className={classNames(
                    `${rootStyle}`,
                    { [`${borderTopStyle}`]: props.view.label },
                    props.view.className
                )}
            >
                <legend className={legendStyle} align="center">
                    {label}
                </legend>
                <div>
                    {props.children}
                </div>
                {props.errorMessage.map(message => (
                    <div key={message} className={errorStyle}>
                        {message}
                    </div>
                ))}
            </fieldset>
        </div>
    );
}

ObjectView.propTypes = {
    children: PropTypes.node,
    editKey: PropTypes.string,
    view: PropTypes.shape({
        className: PropTypes.string,
        label: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    }),
    errorMessage: PropTypes.arrayOf(PropTypes.string),
};
export default ObjectView;
