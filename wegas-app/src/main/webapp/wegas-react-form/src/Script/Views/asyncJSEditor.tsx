import * as React from 'react';
import { AceEditorProps } from 'react-ace';
import { SimpleLoader } from '../../Components/Loader';
// import { JSEditor as TEST } from './JSEditor';

// window.ace.require = window.ace.acequire;

// import('ace-builds/src-noconflict/mode-json');
// import('ace-builds/src-noconflict/theme-github');

// const AsyncJSEditor = React.lazy(() => import(
//     /* webpackChunkName: "ace-js" */ './JSEditor').then(file => ({
//     default: file.JSEditor,
// })));

// import {JSEditor as AsyncJSEditor} from "react-ace";

const AsyncJSEditor = React.lazy(() => import('./JSEditor'));


export default function JSEditor(props: AceEditorProps) {
    return (
        // <TEST {...props} />
        <React.Suspense fallback={<SimpleLoader />}>
            <AsyncJSEditor {...props} />
        </React.Suspense>
    );
}
