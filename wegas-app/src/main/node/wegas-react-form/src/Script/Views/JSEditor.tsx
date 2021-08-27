import * as React from 'react';
import 'brace';
import AceEditor, { AceEditorProps } from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/kuroir';

export default function JSEditor(props: AceEditorProps) {
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
