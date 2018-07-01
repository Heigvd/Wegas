import loadAsync from '../../HOC/loadAsyncComp';
import React from 'react';
import { AceEditorProps } from 'react-ace';

export default loadAsync(() =>
    import(/* webpackChunkName: "ace-js" */ './JSEditor').then(
        ({ JSEditor }) => JSEditor
    )
) as React.ComponentClass<AceEditorProps>;
