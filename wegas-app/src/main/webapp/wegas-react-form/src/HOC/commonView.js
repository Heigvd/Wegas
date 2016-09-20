import React, { PropTypes } from 'react';
import classNames from 'classnames';
import styles from '../css/commonView.css';

export default function comonView(Comp) {
    function CommonComp(props) {
        const errors = props.errorMessage && props.errorMessage.map(
            v => (
                <span>
                    <i
                        className={classNames({
                            fa: props.errorMessage,
                            'fa-info-circle': props.errorMessage
                        })
                        }aria-hidden="true"
                    />
                        {v}
                </span>

                ));

        return (
            <div className={props.view.className}>
                <div
                    className={styles.label}
                >
                    {props.view.label}
                </div>
                <Comp {...props} />
                <div
                    className={classNames({
                        [styles.infos]: props.view.description,
                    })
                    }
                >
                    <i
                        className={classNames({
                            fa: props.view.description,
                            'fa-info-circle': props.view.description
                        })
                        }aria-hidden="true"
                    />
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
    CommonComp.propTypes = {
        errorMessage: PropTypes.arrayOf(PropTypes.string),
        view: PropTypes.shape({
            label: PropTypes.string,
            description: PropTypes.string,
            className: PropTypes.string
        }).isRequired
    };
    return CommonComp;
}
