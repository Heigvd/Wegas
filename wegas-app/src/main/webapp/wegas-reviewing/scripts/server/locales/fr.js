/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
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
/*
 * REGEX
 * Accent detection : [^\w\s\d\{\}\[\],.%\*\/\(\)<>@.:\"\\=;|\'-+&#]
 *
 */
i18nTable.fr = {
    wc: "Nombre de mots",
    cc: "Nombre de signes",
    data: "Textes",
    mean: "Moyenne",
    median: "Médiane",
    sd: "écart-type",
    overview: "Aperçu",
    status: "État",
    reviewDone: "Feedbacks écrits",
    commented: "Feedbacks commentés",
    closed: "Processus clos",
    completed: "Commentaires terminés",
    commenting: "Rédaction des commentaires",
    reviewing: "Rédaction des feedbacks",
    editing: "Rédaction des textes",
    ready: "Prêt pour démarrer le processus",
    na: "N/A",
    evicted: "Évincé"
};
i18nOrdinate.fr = function(number) {
    "use strict";
    switch (number) {
        case 1:
            return number + "er";
        default:
            return number + "e";
    }
};
