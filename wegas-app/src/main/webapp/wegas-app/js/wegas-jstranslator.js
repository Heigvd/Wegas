/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-jstranslator", function(Y) {

    function JSTranslator() {
        this._strs = Y.Intl.get("wegas-jstranslator");
    }

    JSTranslator.prototype = {
        constructor: JSTranslator,
        getRB: function() {
            return this._strs;
        }
    };

    Y.namespace('Wegas').JSTranslator = JSTranslator;
});