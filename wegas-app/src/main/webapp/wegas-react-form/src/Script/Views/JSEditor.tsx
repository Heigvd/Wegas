import * as React from 'react';
import 'brace';
import AceEditor, { IAceEditorProps } from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/kuroir';

export default function JSEditor(props: IAceEditorProps) {
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
