/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add("wegas-text-input", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", TextInput, Wegas = Y.Wegas;
    /**
     * @name Y.Wegas.TextInput
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to edit text
     * @constructor
     */
    TextInput = Y.Base.create("wegas-text-input", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.TextInput# */


        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"wegas-text-input-editor\"></div>" +
            "<div class=\"wegas-text-input-toolbar\"><span class=\"status\"></span></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
        },
        /**
         * @function
         * @private
         */
        renderUI: function() {
//            Y.once("domready", function() {
            if (this.get("readonly")) {
                this.get("contentBox").one(".wegas-text-input-editor").setContent(this.getInitialContent());
            } else {
                this.editor = new tinymce.Editor(this.get("contentBox").one(".wegas-text-input-editor").getDOMNode(), {
                    plugins: [
                        "autolink link image lists code media table contextmenu paste advlist textcolor"
                            //textcolor wordcount autosave advlist charmap print preview hr anchor pagebreak spellchecker directionality
                    ],
                    external_plugins: {
                        "dynamic_toolbar": Y.Wegas.app.get("base") + "wegas-editor/js/plugin/wegas-tinymce-dynamictoolbar.js"
                    },
                    //toolbar1: "bold italic bullist | link image media code addToolbarButton",
                    toolbar1: "bold italic bullist | link code addToolbarButton",
                    toolbar2: "forecolor backcolor underline alignleft aligncenter alignright alignjustify table",
                    toolbar3: "fontselect fontsizeselect styleselect",
                    // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect fontsizeselect styleselect spellchecker template
                    // contextmenu: "link image inserttable | cell row column deletetable | formatselect forecolor",
                    menubar: false,
                    statusbar: false,
                    relative_urls: false,
                    toolbar_items_size: 'small',
                    hidden_tootlbar: [2, 3],
                    setup: Y.bind(function(editor) {
                        //editor.on('keyUp', Y.bind(this._keyup, this)); // Update on editor update
                        editor.on('keyUp', Y.bind(this._onChange, this)); // Update on editor update
                        //editor.on('NodeChange', Y.bind(this.setContent, this)); // Update on editor update
                        this.editor = editor;
                    }, this),
                    image_advtab: true,
                    autoresize_min_height: 35,
                    autoresize_max_height: 500,
                    content_css: [
                        Wegas.app.get("base") + "wegas-editor/css/wegas-inputex-rte.css"
                    ],
                    style_formats: [{// Style formats
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
                        }]}, tinymce.EditorManager);
                this.editor.render();
                //this.setContent();
                if (this.get("showSaveButton")) {
                    this.addButton = new Wegas.Button({
                        label: "<span class=\"wegas-icon wegas-icon-save\"></span>",
                        tooltip: "Save",
                        cssClass: "wegas-text-input-save",
                        on: {
                            click: Y.bind(this.onSave, this)
                        }
                    }).render(this.get("contentBox").one(".wegas-text-input-toolbar"));
                }
            }
            // }, this);
        },
        syncUI: function() {
            this.setContent();
        },
        setContent: function() {
            Y.later(100, this, function() {
                this.editor.setContent(this.getInitialContent());
                /*var tmceI = tinyMCE.get(this.get("contentBox").one(".wegas-text-input-editor"));
                 if (tmceI) {
                 tmceI.setContent(this.getInitialContent());
                 }*/

            });
        },
        getInitialContent: function() {
            return this.get("variable.evaluated").getInstance().get("value");
        },
        setStatus: function(msg) {
            if (this.get("showStatus")) {
                this.get("contentBox").one(".status").setContent("<p>" + msg + "</p>");
            }
        },
        _onChange: function() {
            this.setStatus("Not saved");
            this.valueChanged(this.editor.getContent());

            if (!this.get("showSaveButton")) {
                if (this.wait) {
                    this.wait.cancel();
                }
                this.wait = Y.later(750, this, function() {
                    this.wait = null;
                    this.onSave();
                });
            }
        },
        valueChanged: function(newValue) {
            // To Be Overwritten
        },
        onSave: function() {
            var value = this.editor.getContent(),
                msg = (this.save(value) ? "Saved" : "Something went wrong");
            this.setStatus(msg);
        },
        save: function(value) {
            var theVar = this.get("variable.evaluated").getInstance();
            theVar.set("value", value);
            Y.Wegas.Facade.Variable.cache.put(theVar.toObject());
            return true;
        },
        getEditorLabel: function() {
            return this.get(CONTENTBOX).get("text");
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
            if (this.addButton) {
                this.addButton.destroy();
            }
        }
    }, {
        /** @lends Y.Wegas.TextInput */
        EDITORNAME: "TextInput",
        ATTRS: {
            /**
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: ["TextDescriptor"]
                }
            },
            readonly: {
                //getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "boolean",
                value: false,
                optional: true
                    /*_inputex: {
                     _type: "variableselect",
                     label: "Editable",
                     classFilter: ["BooleanDescriptor"]
                     }*/
            },
            showSaveButton: {
                type: "boolean",
                value: true,
                optional: true
            },
            showStatus: {
                type: "boolean",
                value: true,
                optional: true
            }

        }
    });
    Y.Wegas.TextInput = TextInput;
});
