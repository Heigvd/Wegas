/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-script", function (Y) {

    var inputEx = Y.inputEx;

    inputEx.Script = function (options) {
        inputEx.Script.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Script, inputEx.Textarea, {

        getValue: function () {
            return {
                '@class': "Script",
                language: "JavaScript",
                content: inputEx.Script.superclass.getValue.call(this)
            };
        },

        setValue: function (val) {
            val = val || {
                content: ""
            };
            inputEx.Script.superclass.setValue.call(this, val.content);
        }
    });


    //inputEx.registerType('script', inputEx.Script);                               // Register this class as "script" type
});