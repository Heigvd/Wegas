
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
/*global I18n, YUI*/


var lang = I18n._currentLocale;
YUI.add("wegas-i18n-mcq", function(Y) {
    "use strict";
    Y.log("MCQ " + lang + " translation laoded");
}, 1.0, {requires: ["wegas-i18n-mcq-" + lang]});