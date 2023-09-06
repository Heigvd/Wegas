/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


(function() {
    "use strict";

    //const bigInt = 99999999999999999999999n;
    //const veryBigInt = bigInt * 99n;

    const obj = {
        machin: {
            truc: {
                much: 'hello'
            }
        }
    };

    if (obj?.machin?.truc?.much === 'hello'){
        console.log("check");
    }

    const x = null;
    const y = x ?? "c'est vide";
    console.log("Y: ", y)
})();