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


        CONTENT_TEMPLATE: "<div class=\"wegas-text-input-editor\"></div>"
            + "<div class=\"wegas-text-input-toolbar\"></div>",
        initializer: function() {
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            Y.once("domready", function() {
                this.editor = new tinymce.Editor(this.get("boundingBox").one(".wegas-text-input-editor").getDOMNode(), {
                    plugins: [
                        "autolink autoresize link image lists code media table contextmenu paste advlist textcolor"
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
                        editor.on('change', Y.bind(this.fireUpdatedEvt, this));
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

                //this.editor.on('change', Y.bind(this.sendUpdatedEvt, this));    // Update on editor update
                this.editor.render();

                this.editor.setContent(this.get("variable.evaluated").getInstance().get("value"));

                this.addButton = new Wegas.Button({
                    label: "<span class=\"wegas-icon wegas-icon-save\"></span>",
                    tooltip: "Save",
                    cssClass: "wegas-text-input-save",
                    on: {
                        click: Y.bind(this.save, this)
                    }
                }).render(this.get("boundingBox").one(".wegas-text-input-toolbar"));
            }, this);
        },
        save: function() {
            var theVar = this.get("variable.evaluated").getInstance();
            theVar.set("value", this.editor.getContent());
            Y.Wegas.Facade.Variable.cache.put(theVar.toObject());
        },
        getEditorLabel: function() {
            return this.get(CONTENTBOX).get("text");
        },
        /**
         * Render the field
         */
        renderUI: function() {
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
            userEditable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                optional: true,
                _inputex: {
                    _type: "variableselect",
                    label: "Editable",
                    classFilter: ["BooleanDescriptor"]
                }
            }
        }
    });
    Y.Wegas.TextInput = TextInput;
});
