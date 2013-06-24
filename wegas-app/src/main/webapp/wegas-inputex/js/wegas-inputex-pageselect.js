/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add("wegas-inputex-pageselect", function (Y) {
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
    Y.namespace("inputEx.Wegas").PageSelect = function (options) {
        inputEx.Wegas.PageSelect.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.PageSelect, inputEx.SelectField, {

        setOptions: function (options) {
            inputEx.Wegas.PageSelect.superclass.setOptions.call(this, options);
            Y.Wegas.Facade.Page.cache.getIndex(Y.bind(this.buildList, this));

        },

        setValue: function (val) {
            inputEx.Wegas.PageSelect.superclass.setValue.apply(this, arguments);
            this.options.value = val;
        },

        buildList: function(value){
            var i;
            for(i in value){
                this.addChoice({
                    value: i,
                    label: "Page : " + i
                });
                if (i == this.options.value){
                    this.choicesList[i-1].node.selected = "selected";
                }
            }
        }
    });

    inputEx.registerType("pageselect", inputEx.Wegas.PageSelect);               // Register this class as "wegasurl" type
});
