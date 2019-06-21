import * as React from 'react';
import { SimpleLoader } from '../../Components/Loader';
import { AceEditorProps } from 'react-ace';
const AsyncJSEditor = React.lazy(() =>
    import(/* webpackChunkName: "ace-js" */ './JSEditor').then(file => ({
        default: file.JSEditor,
    }))
);
export default function JSEditor(props: AceEditorProps) {
    return (
        <React.Suspense fallback={<SimpleLoader />}>
            <AsyncJSEditor {...props} />
        </React.Suspense>
    );
}
