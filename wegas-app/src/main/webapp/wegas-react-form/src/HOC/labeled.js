import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from '../css/commonView.css';

export default function labeled(Comp, cssContainer = "" , suffixed = false) {
    function Labeled(props) {
                if (suffixed) {
                    const id = props.path.join('-');
                    return (
                        <div className={cssContainer} >
                            < Comp { ...props } />
                            <label htmlFor={id} className={styles.label} >
                            { props.view.label }
                            </label>
                        </div>
                    );
                } else {
                    return (
                        <div className={cssContainer} >
                            <div className={styles.label} >
                                { props.view.label }
                            </div>
                            < Comp { ...props } />
                        </div>
                    );
                }
            }
            Labeled.propTypes = {
                view: PropTypes.shape({
                    label: PropTypes.string,
                    className: PropTypes.string,
                    description: PropTypes.string,
                    borderTop: PropTypes.bool,
                    style: PropTypes.object,
                    layout: PropTypes.string
                })
            };
    //Labeled.defaultProps = { view: {} };
    return Labeled;
}
