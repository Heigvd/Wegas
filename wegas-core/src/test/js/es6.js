/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


(function() {
    "use strict";
    const list = [{
            type: "fruit",
            name: "apple"
        }, {
            type: "fruit",
            name: "banana"
        }, {
            type: "spice",
            name: "cilantro"
        }];
    let favorite = "apple";

    const isAFruit = (fruit) => {
        const find = list.find((item) => item.name === fruit);
        return find && find.type === "fruit";
    };

    class Friut {
        constructor(name, taste) {
            this.name = name;
            this.taste = taste;
        }
    }

    const aFruit = new Fruit("kiwi", "sour");

    const aPromise = new Promise((resolve, reject) => {
        resolve("Hello");
    });

    aPromise.then((value) => {
        console.log(value);
    }, (error) => {
        console.err(error);
    });

    const sym = Symbol('FRUIT');

    const myFn = (x = 10) => {
        console.log(x);
    };

    const sum = (...args) => args.reduce((acc, cur) => cur + acc, 0);

    const x = sum(1, 2, 3, 4);
    console.log("x: ", x);

    console.log(Number.isInteger(Number.MIN_SAFE_INTEGER));

})();
