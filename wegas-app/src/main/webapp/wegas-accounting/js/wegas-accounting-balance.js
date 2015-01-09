/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/*global YUI*/

YUI.add("wegas-accounting-balance", function(Y) {
    "use strict";
    var Wegas = Y.Wegas, BalanceSheet;
    BalanceSheet = Y.Base.create("wegas-accounting-balance", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        initializer: function() {
        },
        renderUI: function(){
        },
        bindUI: function() {
        },
        syncUI: function() {
        },
        destructor: function() {
        }
    }, {
        ATTRS: {
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect"
                }
            }
        }
    });
});