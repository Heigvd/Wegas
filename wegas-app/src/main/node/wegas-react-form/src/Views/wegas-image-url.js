import PropTypes from 'prop-types';
import React from 'react';
import WegasUrl from './wegas-url';

function WegasImageUrl(props) {
    const updatedProps = Object.assign({}, props, {
        view: Object.assign({}, props.view, {
            filter: function filter() {
                return /image\/|application\/wfs-directory/.test(
                    this.get('data.mimeType')
                );
            },
        }),
    });
    return <WegasUrl {...updatedProps} />;
}
WegasImageUrl.propTypes = {
    view: PropTypes.object,
};
export default WegasImageUrl;
