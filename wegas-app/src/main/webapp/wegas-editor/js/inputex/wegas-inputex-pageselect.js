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
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global YUI*/
YUI.add('wegas-inputex-pageselect', function(Y) {
    'use strict';

    var inputEx = Y.inputEx;

    /**
     * Adds an url regexp, and display the favicon at this url
     * @class inputEx.UrlField
     * @extends inputEx.StringField
     * @constructor
     * @param {Object} options inputEx.Field options object
     * <ul>
     *   <li>favicon: boolean whether the domain favicon.ico should be displayed or not (default is true, except for
     *     https)</li>
     * </ul>
     */
    Y.namespace('inputEx.Wegas').PageSelect = function(options) {
        inputEx.Wegas.PageSelect.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.PageSelect, inputEx.SelectField, {
        renderComponent: function(options) {
            inputEx.Wegas.PageSelect.superclass.renderComponent.call(this, options);
            Y.Wegas.Facade.Page.cache.getIndex(Y.bind(this.buildList, this));
        },
        setValue: function(val) {
            inputEx.Wegas.PageSelect.superclass.setValue.apply(this, arguments);
            this.options.value = val;
        },
        buildList: function(value) {
            Y.Array.each(value, function(v, i) {
                this.addChoice({
                    value: v.id,
                    label: v.name ? v.name : '<i>Unnamed (' + v.id + ')</i>'
                });
                if ('' + v.id === '' + this.options.value) {
                    this.choicesList[i].node.selected = 'selected';
                }
            }, this);
        }
    });

    inputEx.registerType('pageselect', inputEx.Wegas.PageSelect);               // Register this class as "wegasurl"
                                                                                // type
});
