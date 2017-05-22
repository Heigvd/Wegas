import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { css } from 'glamor';



function ReviewView(props) {
    return (
        <div>
            <span>
                {props.view.label}
            </span>
        </div>
    );
}

ReviewView.propTypes = {
    view: PropTypes.shape({
        className: PropTypes.string,
        label: PropTypes.string,
    }),
    //errorMessage: PropTypes.array,
    //editKey: PropTypes.string,
};
export default ReviewView;
