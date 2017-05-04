import React from 'react';
import { asyncReactor } from 'async-reactor';

function JSE(props) {
    return import(
        /* webpackChunkName: "ace-js" */ './JSEditor'
    ).then(({ JSEditor }) => <JSEditor {...props} />);
}
export default asyncReactor(JSE, () => <i>Loading ...</i>);
