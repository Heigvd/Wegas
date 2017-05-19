import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import classNames from 'classnames';
import FormStyles from '../Views/form-styles';

const containerStyle = css({
    position: 'relative',
    marginTop: '1.3em'
});

const extraShortStyle = css({
    maxWidth: '5em'
});

const shortStyle = css({
    maxWidth: '9em'
});

const shortInlineStyle = css(
    {
        display: 'inline-block',
        marginRight: '4em',
        verticalAlign: 'top'
    },
    shortStyle
);

const longStyle = css({
    maxWidth: FormStyles.textInputWidth
});

const infoStyle = css(
    FormStyles.unselectable,
    {
        color: '#99a6b2',
        fontSize: '10px',
        fontStyle: 'italic'
    }
);

const errorStyle = css({
    color: 'darkorange',
    fontSize: '75%',
    fontStyle: 'italic',
    float: 'left'
});


// @TODO Where did this one come from ???
const borderTopStyle = css({
    borderTop: '2px solid #6a95b6',
    width: '40em',
    paddingTop: '1em'
});

const indentStyle = css({
    marginLeft: '22px !important'
});


export default function commonView(Comp) {
    function CommonView(props) {
        const errors = props.errorMessage && props.errorMessage.map(
            v => (
                <span key={v}>
                    {v}
                </span>

            ));
        const layout = props.view.layout || 'long';
        return (
            <div
                className={classNames(
                    props.view.className,
                    `${containerStyle}`,
                    {
                        [`${shortStyle}`]: layout === 'short',
                        [`${shortInlineStyle}`]: layout === 'shortInline',
                        [`${longStyle}`]: layout === 'long',
                        [`${extraShortStyle}`]: layout === 'extraShort',
                        [`${borderTopStyle}`]: props.view.borderTop,
                        [`${indentStyle}`]: props.view.indent
                    })
                }
                style={props.view.style}
                >
                <Comp {...props} />
                <div
                    className={infoStyle}
                >
                    {props.view.description}
                </div>
                <div
                    className={errorStyle}
                >
                    {errors}
                </div>
            </div>
        );
    }
    CommonView.propTypes = {
        errorMessage: PropTypes.arrayOf(PropTypes.string),
        view: PropTypes.shape({
            label: PropTypes.string,
            description: PropTypes.string,
            className: PropTypes.string,
            //borderTop: PropTypes.bool,
            //indent: PropTypes.bool,
            style: PropTypes.object,
            layout: PropTypes.string
        })
    };
    CommonView.defaultProps = { errorMessage: [], view: {} };
    return CommonView;
}
