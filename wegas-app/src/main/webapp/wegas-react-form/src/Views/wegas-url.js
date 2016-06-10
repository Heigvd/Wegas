import React from 'react';
import StringView from './string';
import IconButton from 'material-ui/IconButton';
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

export default WegasUrl;
