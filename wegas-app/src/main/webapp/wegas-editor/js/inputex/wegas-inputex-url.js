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
YUI.add("wegas-inputex-url", function(Y) {
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
    Y.namespace("inputEx.Wegas").UrlField = function(options) {
        inputEx.Wegas.UrlField.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.UrlField, inputEx.StringField, {
        filepanel: null,
        /**
         * Adds the invalid Url message
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            inputEx.Wegas.UrlField.superclass.setOptions.call(this, options);
            //this.options.favicon = lang.isUndefined(options.favicon) ? (("https:" == document.location.protocol) ? false : true) : options.favicon;
            // validate with url regexp
            // this.options.regexp = inputEx.regexps.url;
        },
        /**
         *
         */
        //getValue: function () {
        //    return {
        //        srcUrl: inputEx.Wegas.UrlField.superclass.getValue.call(this)
        //    }
        //},
        destructor: function() {
            if (this.filepanel) {
                this.fileExplorer.destroy();
                this.filepanel.destroy();
            }
        },
        /**
         * Adds a img tag before the field to display the favicon
         */
        render: function() {
            inputEx.Wegas.UrlField.superclass.render.call(this);

            this.fieldContainer.classList.add("inputEx-wegas-UrlField");

            this.imgButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-fileexplorer\"></span>",
                on: {
                    click: Y.bind(this.showFileExplorer, this)
                }
            }).render(this.fieldContainer);
        },
        showFileExplorer: function() {
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
            this.filepanel.on("visibleChange", function() {
                Y.later(0, this, function() {
                    this.fileExplorer.destroy();
                    this.filepanel.destroy();
                });
            }, this);

            this.fileExplorer = new Y.Wegas.FileExplorer().render(this.filepanel.getStdModNode(Y.WidgetStdMod.BODY));

            this.fileExplorer.on("*:fileSelected", function(e, path) {
                e.stopImmediatePropagation();
                e.preventDefault();
                this.filepanel.hide();
                this.setValue(path);
            }, this);
        }
    });

    inputEx.registerType("wegasurl", inputEx.Wegas.UrlField);                   // Register this class as "wegasurl" type

    Y.namespace("inputEx.Wegas").ImageUrlField = function(options) {
        inputEx.Wegas.ImageUrlField.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.ImageUrlField, inputEx.Wegas.UrlField, {
        /**
         * Adds a img tag before the field to display the favicon
         */
        render: function() {
            inputEx.Wegas.ImageUrlField.superclass.render.call(this);
            var cb = new Y.Node(this.divEl);
            cb.append("<div class=\"preview\"></div>");
        },
        setValue: function(val) {
            inputEx.Wegas.ImageUrlField.superclass.setValue.apply(this, arguments);
            var cb = new Y.Node(this.divEl),
                    previewNode = cb.one(".preview");
            if (val && val.length > 0) {
                previewNode.setContent('<img data-file="' + val + '" style="max-width:100%;border: 1px solid lightgray;padding: 2px;" />');
                Y.Plugin.Injector.parser(previewNode.one("img"));               // Manually run parser, since it is not plugged on the editor
            }
        }
    });

    inputEx.registerType("wegasimageurl", inputEx.Wegas.ImageUrlField);         // Register this class as "wegasurl" type
});
