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

i18nTable.en = {
    wc: "Words count",
    cc: "Characters count",
    data: "Data",
    mean: "Average",
    median: "Median",
    sd: "standard deviation",
    overview: "Overview",
    status: "Status",
    reviewDoneTitle: "Feddbacks Done",
    commentsDoneTitle: "Comments Done",
    reviewDone: "Feddbacks Done",
    commented: "Comments Done",
    closed: "Done",
    completed: "Done",
    commenting: "Ongoing",
    reviewing: "Ongoing",
    editing: "Ongoing",
    ready: "Done",
    na: "N/A",
    evicted: "Evicted"
};

i18nOrdinate.en = function(number) {
    "use strict";
    switch (number) {
        case 1:
            return number + "st";
        case 2:
            return number + "nd";
        case 3:
            return number + "rd";
        default:
            return number + "th";
    }
};
