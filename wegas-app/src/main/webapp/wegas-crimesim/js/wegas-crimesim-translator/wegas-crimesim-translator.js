/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add("wegas-crimesim-translator", function(Y) {

    function Translator() {
        this._strs = Y.Intl.get("wegas-crimesim-translator");
    }

    Translator.prototype = {
        constructor: Translator,
        getRB: function() {
            return this._strs;
        }
    };

    Y.Wegas.Translator = Translator;

});