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
            var i;
            inputEx.Wegas.PageSelect.superclass.setOptions.call(this, options);
            this.options.choices = [];
            for (i in Y.Wegas.PageFacade.data) {
                if (Y.Wegas.PageFacade.data.hasOwnProperty(i)) {
                    this.options.choices.push({
                        value: Y.Wegas.PageFacade.rest.getPage(i).id,
                        label: "Page : " + Y.Wegas.PageFacade.rest.getPage(i).id
                    });
                }  
            }
        }
    });

    inputEx.registerType("pageselect", inputEx.Wegas.PageSelect);               // Register this class as "wegasurl" type
});
