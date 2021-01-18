/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


(async function() {
    "use strict";

    const aMessage = async () => {
        return new Promise((resolve) => {
            resolve("Hello, world!");
        });
    };

    const msg = await aMessage();

    console.log(msg);


    const obj = {
        v1: "hello",
        v2: "salut"
    };

    Object.entries(obj);

    Object.values(obj);

    return new Promise((resolve) => resolve());
})();