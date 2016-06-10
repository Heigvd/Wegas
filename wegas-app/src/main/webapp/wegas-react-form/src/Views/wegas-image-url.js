import React from 'react';
import WegasUrl from './wegas-url';
function WegasImageUrl(props) {
    const updatedProps = Object.assign({}, props,
        {
            view: Object.assign({}, props.view,
                {
                    filter: function filter() {
                        return (/image\/|application\/wfs-directory/)
                            .test(this.get('data.mimeType'));
                    }
                }
            )
        }
    );
    return <WegasUrl {...updatedProps} />;
}

export default WegasImageUrl;
