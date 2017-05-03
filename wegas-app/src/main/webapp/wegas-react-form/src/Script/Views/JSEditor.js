import React from 'react';
import AceEditor from 'react-ace';
import 'brace/theme/kuroir';
import 'brace/mode/javascript';

function JSEditor(props) {
    return <AceEditor {...props} mode="javascript" theme="kuroir" />;
}
export { JSEditor };
