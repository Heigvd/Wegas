import React from 'react';

function HiddenView() {
    return <noscript />; // Could be null, but Typescript doesn't allow it.
}

export default HiddenView;
