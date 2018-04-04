import * as React from 'react';
import { connect } from 'react-redux';

function RequestIndicator({ count }) {
    if (count > 0) {
        return (
            <span
                style={{
                    margin: '0 10px',
                    color: 'lightgray',
                    float: 'right',
                }}
            >
                Loading... ({count})
            </span>
        );
    }
    return null;
}

export default connect(state => {
    return {
        count: state.globalState.request,
    };
})(RequestIndicator);
