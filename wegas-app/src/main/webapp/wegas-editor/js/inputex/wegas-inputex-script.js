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
YUI.add("wegas-inputex-script", function(Y) {

    var inputEx = Y.inputEx;

    inputEx.Script = function(options) {
        inputEx.Script.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Script, inputEx.Textarea, {
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
        }
    });


    //inputEx.registerType('script', inputEx.Script);                               // Register this class as "script" type
});