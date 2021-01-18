/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


(function() {
    "use strict";

    var food = ["apple", "banana", "cilantro", "dairy", "egg", "fish", "garlic"];

    var taste = {
        good: ["apple"],
        noGood: ["banana", "cilantro"]
    };

    var asString = JSON.stringify(taste);
    var read = JSON.parse(asString);

    var toProcess = food.filter(function(f) {
        return taste.good.indexOf(f) < 0 && taste.noGood.indexOf(f) < 0;
    });

    console.log("ToProcess: " + toProcess);


    var reserverdPropetyName = {
        var : "something"
    };

    console.log(reserverdPropetyName.var);

    var asString = JSON.stringify(taste);
    var read = JSON.parse(asString);

    var toProcess = food.filter(function(f) {
        return taste.good.indexOf(f) < 0 && taste.noGood.indexOf(f) < 0;
    });

    console.log("ToProcess: " + toProcess);

    console.log(Date.now());

    var stringLiteral = "Hello \
                           world";
})();
