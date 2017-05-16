import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from '../css/commonView.css';

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
                    styles.container,
                    {
                        [styles.short]: layout === 'short',
                        [styles.shortInline]: layout === 'shortInline',
                        [styles.long]: layout === 'long',
                        [styles.extraShort]: layout === 'extraShort',
                        [styles.borderTop]: props.view.borderTop,
                        [styles.indent]: props.view.indent
                    })
                }
                style={props.view.style}
            >
                <div
                    className={styles.label}
                >
                    {props.view.label}
                </div>
                <Comp {...props} />
                <div
                    className={classNames({
                        [styles.infos]: props.view.description
                    })
                    }
                >
                    {props.view.description}
                </div>
                <div
                    className={classNames(styles.errs)}
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
            borderTop: PropTypes.bool,
            indent: PropTypes.bool,
            style: PropTypes.object,
            layout: PropTypes.string
        })
    };
    CommonView.defaultProps = { errorMessage: [], view: {} };
    return CommonView;
}
