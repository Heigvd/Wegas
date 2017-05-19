import React from 'react';
import AceEditor, { AceEditorProps } from 'react-ace';
import 'brace/theme/kuroir';
import 'brace/mode/javascript';

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
