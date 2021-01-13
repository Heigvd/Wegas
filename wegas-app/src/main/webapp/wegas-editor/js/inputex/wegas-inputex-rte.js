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
/*global tinyMCE*/
YUI.add("wegas-inputex-rte", function(Y) {
    "use strict";

    var inputEx = Y.inputEx, RTEField,
        Wegas = Y.Wegas;

    /**
     * @class Wrapper for the Rich Text Editor from YUI
     * @name Y.inputEx.Wegas.RTEField
     * @extends Y.inputEx.Textarea
     * @constructor
     * @param {Object} options
     */
    RTEField = function(options) {
        RTEField.superclass.constructor.call(this, options);

    };

    Y.extend(RTEField, inputEx.Textarea, {
        /**
         * Set the default values of the options
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            RTEField.superclass.setOptions.call(this, options);

            this.options.opts = options.opts || {};
            this.options.typeInvite = null;
        },
        /**
         *
         * @returns {undefined}
         */
        destroy: function() {
            if (this.editor) {
                try {
                    this.editor.remove();
                } catch (ex) {
                    //Error in all but chrome it seems.
                    //NS_ERROR_UNEXPECTED
                }
            }
            this.editor = null;
            RTEField.superclass.destroy.call(this);
        },
        /**
         * Render the field using the YUI Editor widget
         */
        renderComponent: function() {
            RTEField.superclass.renderComponent.call(this);
            Y.once("domready", function() {
                tinyMCE.init({
                    selector: "#" + this.el.id,
                    plugins: [
                        "autolink link image lists code media table contextmenu paste advlist textcolor"
                    //textcolor autoresize wordcount autosave advlist charmap print preview hr anchor pagebreak spellchecker
                    // directionality
                    ],
                    external_plugins: {
                        "dynamic_toolbar": Wegas.app.get("base") +
                            "wegas-editor/js/plugin/wegas-tinymce-dynamictoolbar.js"
                    },
                    toolbar1: "bold italic bullist | link image media code addToolbarButton",
                    toolbar2: "forecolor backcolor underline alignleft aligncenter alignright alignjustify table",
                    toolbar3: "fontselect fontsizeselect styleselect",
                    // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect
                    // fontsizeselect styleselect spellchecker template contextmenu: "link image inserttable | cell row
                    // column deletetable | formatselect forecolor",
                    menubar: false,
                    statusbar: false,
                    relative_urls: false,
                    toolbar_items_size: 'small',
                    hidden_tootlbar: [2, 3],
                    file_browser_callback: this.onFileBrowserClick,
                    setup: Y.bind(function(editor) {
                        editor.on('change', Y.bind(this.fireUpdatedEvt, this)); // Fire update on editor updates
                        this.editor = editor;
                    }, this),
                    image_advtab: true,
                    autoresize_min_height: 35,
                    autoresize_max_height: 500,
                    content_css: [
                        Wegas.app.get("base") + "wegas-editor/css/wegas-tinymce-editor.css"
                    ],
                    style_formats: [
                        { // Style formats
                            title: 'Title 1',
                            block: 'h1'
                        }, {
                            title: 'Title 2',
                            block: 'h2'
                        // styles : {
                        //    color : '#ff0000'
                        // }
                        }, {
                            title: 'Title 3',
                            block: 'h3'
                        }, {
                            title: 'Normal',
                            inline: 'span'
                        }, {
                            title: "Code",
                            //icon: "code",
                            block: "code"
                        }]
                });
                Y.one(this.wrapEl).delegate("click", function(e) {
                    Y.one(this.wrapEl).one(".mce-tinymce").toggleClass("mce--more");
                }, ".mce-btn[aria-label='More options']", this);

            //tinymce.createEditor(this.el.id, {});
            //tinymce.execCommand('mceAddEditor', false, this.el.id);
            }, this);
        },
        onFileBrowserClick: function(field_name, url, type, win) {
            RTEField.filePanel = new Wegas.FileSelect();

            RTEField.filePanel.after("*:fileSelected", function(e, path) {
                e.stopImmediatePropagation();
                e.preventDefault();

                var win = RTEField.filePanel.win,
                    field_name = RTEField.filePanel.field_name,
                    targetInput = win.document.getElementById(field_name);
                targetInput.value = Wegas.Facade.File.getPath() + path; // update the input field

                if (typeof (win.ImageDialog) !== "undefined") { // are we an image browser
                    if (win.ImageDialog.getImageData) { // we are, so update image dimensions...
                        win.ImageDialog.getImageData();
                    }

                    if (win.ImageDialog.showPreviewImage) { // ... and preview if necessary
                        win.ImageDialog.showPreviewImage(Wegas.Facade.File.getPath() + path);
                    }
                }
                if (win.Media) { // If in an editor window
                    win.Media.formToData("src"); // update the data
                }
                RTEField.filePanel.destroy();
            });
            RTEField.filePanel.win = win;
            RTEField.filePanel.field_name = field_name;
            return false;
        },
        /**
         * Set the html content
         * @param {String} value The html string
         * @param {boolean} sendUpdatedEvent (optional) Wether this setValue should fire the 'updated' event or not
         *     (default is true, pass false to NOT send the event)
         */
        setValue: function(value, sendUpdatedEvent) {
            if (value && Wegas.Facade.File) {
                value = value.replace(
                    new RegExp("data-file=\"([^\"]*)\"", "gi"),
                    "src=\"" + Wegas.Facade.File.getPath() + "$1\"" +
                    " href=\"" + Wegas.Facade.File.getPath() + "$1\""); // @hack Place both href and src so it
            // will work for both <a> and <img>
            // elements
            }
            RTEField.superclass.setValue.call(this, value, sendUpdatedEvent);

            if (this.editor && this.editor.initialized && Y.Lang.isString(value)) {
                this.editor.setContent(value);
            }
        },
        /**
         * Get the html string
         * @return {String} the html string
         */
        getValue: function() {
            if (this.editor) {
                this.editor.save();
            }
            //return RTEField.superclass.getValue.call(this).replace(reg, "data-file=\"$3\" $1");
            return RTEField.superclass.getValue.call(this)
                .replace(new RegExp("((src|href)=\"[^\"]*/rest/File/GameModelId/[^\"]*/read([^\"]*)\")", "gi"),
                    "data-file=\"$3\"") // Replace absolute path with injector style path
                .replace(new RegExp("((src|href)=\"[^\"]*/rest/GameModel/[^\"]*/File/read([^\"]*)\")", "gi"),
                    "data-file=\"$3\""); // Replace absolute path with injector style path

        }
    });
    inputEx.registerType("html", RTEField, []); // Register this class as "html" type
});
