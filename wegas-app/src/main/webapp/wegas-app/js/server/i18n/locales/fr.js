/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/* global I18n */

/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
var i18nOrdinate = (function(module) {
    return module;
}(i18nOrdinate || {})),
    i18nTable = (function(module) {
        return module;
    }(i18nTable || {}));


I18n.add("fr", {
    question: {
        result: "Résultat",
        results: "Résultats"
    }
});

i18nOrdinate.fr = function(number) {
    "use strict";
    switch (number) {
        case 1:
            return number + "er";
        default:
            return number + "e";
    }
};