/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015, 2016 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

let Z: Y.YUI;
/* global YUI */
YUI.add('wegas-react-form', Y => {
    Z = Y;
    import(
        /* webpackChunkName: "react-form" */ './wegas-react-form'
    )
});

export function getY() {
    return Z;
}
