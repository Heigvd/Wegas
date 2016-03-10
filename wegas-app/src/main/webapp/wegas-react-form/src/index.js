/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015, 2016 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

let Z;
/* global YUI */
YUI.add('wegas-react-form', Y => {
    Z = Y;
    require('./wegas-react-form.js');
});
export function getY() {
    return Z;
}
