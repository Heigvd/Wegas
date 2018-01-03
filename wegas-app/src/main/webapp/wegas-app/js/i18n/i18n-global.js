
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global YUI, I18n */

var lang = I18n._currentLocale;
YUI.add("wegas-i18n-global", function(Y) {
    "use strict";
    Y.log("I18n Global: \"" + lang + "\" translation loaded");
}, 1.0, {requires: ["wegas-i18n-global-" + lang]});