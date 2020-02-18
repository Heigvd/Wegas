import * as React from 'react';
import { IAceEditorProps } from 'react-ace';
import { SimpleLoader } from '../../Components/Loader';

const AsyncJSEditor = React.lazy(() => import(
    /* webpackChunkName: "ace-js" */ './JSEditor').then(file => ({
    default: file.JSEditor,
})));

export default function JSEditor(props: IAceEditorProps) {
    return (
        <React.Suspense fallback={<SimpleLoader />}>
            <AsyncJSEditor {...props} />
        </React.Suspense>
    );
}
