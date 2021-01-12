/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-script", function(Y) {

    var inputEx = Y.inputEx;

    inputEx.Script = function(options) {
        inputEx.Script.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Script, inputEx.AceField, {
        getValue: function() {
            return {
                '@class': "Script",
                language: "JavaScript",
                content: inputEx.Script.superclass.getValue.call(this)
            };
        },
        setValue: function(val, sendUpdatedEvent) {
            val = val || {
                content: ""
            };
            inputEx.Script.superclass.setValue.call(this, val.content, sendUpdatedEvent);
        },
        validate: function() {
            try {
                window.esprima.parse(this.getValue().content);
            } catch (e) {
                return false;
            }
            return true;
        }
    });


    //inputEx.registerType('script', inputEx.Script);                               // Register this class as "script" type
});