/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add("wegas-inputex-var-autocomplete", function(Y) {
    "use strict";

    var inputEx = Y.inputEx;


    Y.namespace("inputEx.Wegas").VarAutoComplete = function(options) {
        inputEx.Wegas.VarAutoComplete.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.VarAutoComplete, inputEx.StringField, {
        /**
         *
         */
        variables: null,
        /**
         *
         * @param {type} options
         * @returns {undefined}
         */
        setOptions: function(options) {
            inputEx.StringField.superclass.setOptions.call(this, options);
            if (options.variableClass) {
                this.findVariable(options.variableClass);
            }
        },
        onFocus: function(d) {
            inputEx.StringField.superclass.onFocus.call(this, d);
        },
        findVariable: function(varName) {
    //use flatten function (in Wegas.cache)
            this.variables =  Y.Wegas.Facade.VariableDescriptor.cache.doFind("GET", "TaskDescriptor");
            console.log(variables);
        }
    });

    inputEx.registerType("wegasvarautocomplete", inputEx.Wegas.VarAutoComplete);// Register this class as "wegasvarautocomplete" type
});