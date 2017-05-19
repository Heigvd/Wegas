import 'brace/mode/javascript';
import 'brace/theme/kuroir';
import React from 'react';
import AceEditor, { AceEditorProps } from 'react-ace';

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
