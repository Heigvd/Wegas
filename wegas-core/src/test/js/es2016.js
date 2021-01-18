/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


(function() {
    "use strict";
    const square = (x) => x ** 2;
    console.log("5² = ", square(5));

    let x = 5;
    x **= 2;
    console.log("5² = ", x);

    const array = ["apple", "banana"];

    array.includes("apple");

    for (const fruit of array) {
        console.log(fruit);
    }

})();

