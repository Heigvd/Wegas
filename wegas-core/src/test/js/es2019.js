/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


(function() {
    "use strict";

    const myArray = [['one', 1], ['two', 2], ['three', 3]];
    const obj = Object.fromEntries(myArray);

    console.log(obj);

    try {
        throw new Error("error");
    } catch {
        console.log("error detected");
    }
})();