import loadAsync from '../../HOC/loadAsyncComp';

export default loadAsync(() =>
    import(/* webpackChunkName: "ace-js" */ './JSEditor').then(
        ({ JSEditor }) => JSEditor
    )
);
