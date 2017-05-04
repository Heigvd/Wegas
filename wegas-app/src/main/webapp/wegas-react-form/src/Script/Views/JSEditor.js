import React from 'react';
import AceEditor from 'react-ace';
import 'brace/theme/kuroir';
import 'brace/mode/javascript';

export default function JSEditor(props) {
    return (
        <AceEditor
            width="100%"
            {...props}
            mode="javascript"
            theme="kuroir"
            editorProps={{ $blockScrolling: Infinity }}
        />
    );
}
export { JSEditor };
