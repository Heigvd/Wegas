/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-inputex-now", function(Y) {
    "use strict";
    var inputEx = Y.inputEx;

    Y.namespace("inputEx.Wegas").Now = function(options) {
        inputEx.Wegas.Now.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.Now, inputEx.HiddenField, {
        getValue: function() {
            return Y.Lang.now();
        }
    });
    inputEx.registerType("now", inputEx.Wegas.Now);
});