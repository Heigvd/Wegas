import React from 'react';
import AceEditor, { AceEditorProps } from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/kuroir';

export default function JSEditor(props: AceEditorProps) {
    // Tell Typescript what is AceEditor. Error in the declaration:
    // 'undefined' state is not valid with new react types.
    // As of react-ace v5.0.1
    const Editor: React.ComponentClass<AceEditorProps> = AceEditor as any;
    return (
        <Editor
            width="100%"
            {...props}
            mode="javascript"
            theme="kuroir"
            editorProps={{ $blockScrolling: Infinity }}
        />
    );
}
export { JSEditor };
