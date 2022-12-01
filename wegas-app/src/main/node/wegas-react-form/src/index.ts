/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015, 2016 School of Management and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
import './wegas-react-form';
let Z: Y.YUI;
/* global YUI */
YUI.add('wegas-react-form-binding', (Y: Y.YUI) => {
    Z = Y;
});

export function getY() {
    return Z;
}
