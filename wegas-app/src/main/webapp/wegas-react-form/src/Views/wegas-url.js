import React, { PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import StringView from './string';
import { getY } from '..';

function openPanel(onChange, filter) {
    return function onClick() {
        const Y = getY();
        const filepanel = new Y.Wegas.FileSelect({
            filter
        });
        filepanel.on('*:fileSelected', (e, path) => {
            e.halt(true);
            filepanel.destroy();
            onChange(path);
        });
    };
}
function WegasUrl(props) {
    return (
        <div>
            <div style={{ width: '70%', display: 'inline-block' }}>
                <StringView {...props} />
            </div>
            <IconButton
                iconClassName="wegas-icon wegas-icon-fileexplorer"
                onClick={openPanel(props.onChange, props.view.filter)}
            />
        </div>);
}
WegasUrl.propTypes = {
    onChange: PropTypes.func.isRequired,
    view: PropTypes.object
};
export default WegasUrl;
