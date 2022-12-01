import * as React from 'react';
import { AceEditorProps } from 'react-ace';
import { SimpleLoader } from '../../Components/Loader';

const AsyncJSEditor = React.lazy(() =>
    import(/* webpackChunkName: "ace-js" */ './JSEditor').then(file => ({
        default: file.JSEditor,
    })),
);

export default function JSEditor(props: AceEditorProps) {
    return (
        <React.Suspense fallback={<SimpleLoader />}>
            <AsyncJSEditor {...props} />
        </React.Suspense>
    );
}
