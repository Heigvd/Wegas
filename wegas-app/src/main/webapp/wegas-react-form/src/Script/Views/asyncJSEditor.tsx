import { asyncReactor } from 'async-reactor';
import React from 'react';
import { AceEditorProps } from 'react-ace/types';

function JSE(props: AceEditorProps) {
    return import(
        /* webpackChunkName: "ace-js" */ './JSEditor'
    ).then(({ JSEditor }) => <JSEditor {...props} />);
}
export default asyncReactor(JSE, () =>
    <i>Loading ...</i>
) as React.ComponentClass<AceEditorProps>;
