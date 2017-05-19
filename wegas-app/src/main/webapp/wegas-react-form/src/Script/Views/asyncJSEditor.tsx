import { asyncReactor } from 'async-reactor';
import React from 'react';
import { AceEditorProps } from 'react-ace/types';
import * as jseditor from './JSEditor';
function JSE(props: AceEditorProps) {

    return _import<typeof jseditor>(
        /* webpackChunkName: "ace-js" */ './JSEditor',
    ).then(({ JSEditor }) => <JSEditor {...props} />);
}
export default asyncReactor(JSE, () => <i>Loading ...</i>) as React.ComponentClass<AceEditorProps>;
