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
YUI.add("wegas-inputex-object", function(Y) {
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
    Y.namespace("inputEx.Wegas").Object = function(options) {
        var elementType = options.elementType;
        inputEx.Wegas.Object.superclass.constructor.call(this, options);
        if (elementType) {
            this.options.elementType = elementType;
        }
    };

    Y.extend(inputEx.Wegas.Object, inputEx.ObjectField, {
    });

    inputEx.registerType("wegasobject", inputEx.Wegas.Object);                   // Register this class as "wegasurl" type
});