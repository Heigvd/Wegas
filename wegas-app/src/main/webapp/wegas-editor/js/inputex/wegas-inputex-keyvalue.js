/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add("wegas-inputex-keyvalue", function(Y) {
    "use strict";

    var inputEx = Y.inputEx;

    /**
     * Adds an url regexp, and display the favicon at this url
     * @class inputEx.UrlField
     * @extends inputEx.StringField
     * @constructor
     * @param {Object} options inputEx.Field options object
     * <ul>
     *   <li>favicon: boolean whether the domain favicon.ico should be displayed or not (default is true, except for https)</li>
     * </ul>
     */
    Y.namespace("inputEx.Wegas").KeyValueField = function(options) {
        inputEx.Wegas.KeyValueField.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.KeyValueField, inputEx.KeyValueField, {
        setOptions: function(options) {
            var i = 0,
                index = 0;
            for (i in options.availableFields) {
                if (options.value) {
                    if (options.availableFields[i].name === options.value[0]) {
                        index = i;
                    }
                }
            }

            var selectFieldConfig = this.generateSelectConfig(options.availableFields);

            var newOptions = {
                fields: [
                    selectFieldConfig,
                    this.nameIndex[options.availableFields[index].name]
                ]
            };
            index++;
            Y.mix(newOptions, options);

            inputEx.Wegas.KeyValueField.superclass.constructor.superclass.setOptions.call(this, newOptions);
        }
    });

    inputEx.registerType("wegaskeyvalue", inputEx.Wegas.KeyValueField);                   // Register this class as "wegasurl" type
});