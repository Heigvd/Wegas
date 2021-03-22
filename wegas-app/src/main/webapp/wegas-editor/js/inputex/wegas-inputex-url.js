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
        filter: null,
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
            this.fileExplorerButton.destroy();
            if(this.uploader){
                this.uploader.destroy();
            }
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

         /*   this.uploader = new Y.UploaderHTML5({
                fileFieldName: "file",
                selectButtonLabel: "<span class='wegas-icon wegas-icon-newfile'></span>",
                appendNewFiles: false,
                multipleFiles: false,
                withCredentials: false,
                dragAndDropArea: Y.one(this.fieldContainer).ancestor(".inputEx-fieldWrapper"),
                uploadURL: Y.Wegas.app.get("base") + Y.Wegas.Facade.File.get("source") + "upload"
            }).render(this.fieldContainer);

            this.uploader.on("fileselect", function() {
                Y.Widget.getByNode(this.fieldContainer).showOverlay();
                this.uploader.uploadAll();
                this.uploader.set("enabled", false);
            }, this);

            this.uploader.on(["dragenter", "dragover"], function() {
                Y.one(this.fieldContainer).one("input").setStyle("background", "#ededed");
            }, this);

            this.uploader.on(["dragleave", "drop"], function(e) {
                Y.one(this.fieldContainer).one("input").setStyle("background", "none");
            }, this);

            this.uploader.on("uploadcomplete", function(e) {
                this.setValue("/" + e.file.get("name"));
                Y.Widget.getByNode(this.fieldContainer).hideOverlay();
                this.uploader.set("enabled", true).set("fileList", []);
            }, this);

            this.uploader.on("uploaderror", function(e) {
                Y.Widget.getByNode(this.fieldContainer).hideOverlay()
                    .showMessage("error", e.statusText || "Error uploading file");
                this.uploader.queue = null;                                     // @hack Otherwise file upload doesnt work after an error
                this.uploader.set("enabled", true).set("fileList", []);
            }, this);*/
            // this.uploader.on("alluploadscomplete", function() {}, this);

            this.uploadButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-fileexplorer\"></span>",
                on: {
                    click: Y.bind(this.showFileExplorer, this)
                }
            }).render(this.fieldContainer);
        },
        showFileExplorer: function() {
            this.filepanel = new Y.Wegas.FileSelect({
                filter: this.filter
            });

            this.filepanel.on("*:fileSelected", function(e, path) {
                e.stopImmediatePropagation();
                e.preventDefault();
                this.filepanel.destroy();
                this.setValue(path);
            }, this);
        }
    });

    inputEx.registerType("wegasurl", inputEx.Wegas.UrlField);                   // Register this class as "wegasurl" type

    Y.namespace("inputEx.Wegas").ImageUrlField = function(options) {
        inputEx.Wegas.ImageUrlField.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.ImageUrlField, inputEx.Wegas.UrlField, {
        filter: function() {
            return (/image\/|application\/wfs-directory/).test(this.get("data.mimeType"));
        },
        /**
         * Adds a img tag before the field to display the favicon
         */
        render: function() {
            inputEx.Wegas.ImageUrlField.superclass.render.call(this);
            Y.one(this.divEl).append("<div class=\"preview\"></div>");
        },
        setValue: function(val) {
            inputEx.Wegas.ImageUrlField.superclass.setValue.apply(this, arguments);
            var previewNode = Y.one(this.divEl).one(".preview");
            if (val && val.length > 0) {
                previewNode.setContent('<img data-file="' + val + '" style="max-width:100%;padding-top: 5px;" />');
                Y.Plugin.Injector.parser(previewNode.one("img"));               // Manually run parser, since it is not plugged on the editor
            }
        }
    });

    inputEx.registerType("wegasimageurl", inputEx.Wegas.ImageUrlField);         // Register this class as "wegasurl" type
});
