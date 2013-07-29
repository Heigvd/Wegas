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
YUI.add("wegas-inputex-url", function (Y) {
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
    Y.namespace("inputEx.Wegas").UrlField = function (options) {
        inputEx.Wegas.UrlField.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.UrlField, inputEx.StringField, {

        filepanel: null,

        /**
         * Adds the invalid Url message
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function (options) {
            inputEx.Wegas.UrlField.superclass.setOptions.call(this, options);

        //            this.options.className = options.className ? options.className : "inputEx-Field inputEx-UrlField";
        //            this.options.messages.invalid = inputEx.messages.invalidUrl;
        //            this.options.favicon = lang.isUndefined(options.favicon) ? (("https:" == document.location.protocol) ? false : true) : options.favicon;
        //            this.options.size = options.size || 50;

        // validate with url regexp
        //            this.options.regexp = inputEx.regexps.url;
        },

        /**
         *
         */
        //getValue: function () {
        //    return {
        //        srcUrl: inputEx.Wegas.UrlField.superclass.getValue.call(this)
        //    }
        //},

        /**
         * Adds a img tag before the field to display the favicon
         */
        render: function () {
            inputEx.Wegas.UrlField.superclass.render.call(this);

            this.fieldContainer.classList.add("inputEx-wegas-UrlField");

            this.imgButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-fileexplorer\"></span>",
                on: {
                    click: Y.bind(this.showFileExplorer, this)
                }
            }).render(this.fieldContainer);
        },

        showFileExplorer: function () {
            if (!this.filepanel) {
                this.filepanel = new Y.Panel({
                    headerContent: 'Choose a file from library',
                    bodyContent: '',
                    width: 600,
                    height: Y.DOM.winHeight() - 150,
                    zIndex: 80,
                    modal: true,
                    render: true,
                    centered: true
                });

                this.fileExplorer = new Y.Wegas.FileExplorer().render(this.filepanel.getStdModNode(Y.WidgetStdMod.BODY));

                this.fileExplorer.on("*:fileSelected", function (e, path) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    this.filepanel.hide();
                    this.setValue(path);
                }, this);
            }
            this.filepanel.show();
        }
    });

    inputEx.registerType("wegasurl", inputEx.Wegas.UrlField);                   // Register this class as "wegasurl" type
});
