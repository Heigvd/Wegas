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
    var CONTENTBOX = "contentBox", TextInput, StringInput,
        Wegas = Y.Wegas;
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
            "<div class=\"wegas-input-label\"></div>" +
            "<div class=\"wegas-text-input-editor\"></div>" +
            "<div class=\"wegas-text-input-toolbar\">" +
            "<span class=\"cc\"></span>" +
            "<span class=\"wc\"></span>" +
            "<span class=\"status\"></span>" +
            "</div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this.publish("save", {
                emitFacade: true
            });
        },
        /**
         * @function
         * @private
         */
        renderUI: function() {
            var CB = this.get("contentBox");
            //CB.addClass("wegas-text-input-" + this.get("variable.evaluated").get("name"));
//            Y.once("domready", function() {
            if (this.get("label")) {
                CB.one(".wegas-input-label").setContent(this.get("label"));
            }

            if (this.get("readonly")) {
                CB.one(".wegas-text-input-editor").setContent("<div class=\"readonly\">" + this.getInitialContent() + "</div>");

            } else {
                Y.once("domready", function() {
                    //this.editor = new tinymce.Editor(this.get("contentBox").one(".wegas-text-input-editor").getDOMNode(),
                    if (this.editor){
                        return;
                    }
                    tinyMCE.init({
                        //selector: this.get("contentBox").one(".wegas-text-input-editor").getDOMNode(),
                        selector: "#" + this.get("contentBox").get("id") + " .wegas-text-input-editor",
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
                            if (this.get("disablePaste")) {
                                editor.on('paste', function(e) {
                                    e.preventDefault();
                                });
                            }
                            // Update on editor update
                            editor.on('keyUp', Y.bind(this._onChange, this)); // Update on editor update
                            //editor.on('NodeChange', Y.bind(this.setContent, this)); // Update on editor update
                            this.editor = editor;
                            this.syncUI();
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
                            }]});
                }, this);
                //this.editor.render();
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
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
        },
        syncUI: function() {
            this.setContent();
        },
        setContent: function() {

            if (this.get("readonly")) {
                this.get("contentBox").one(".wegas-text-input-editor").setContent("<div class=\"readonly\">" + this.getInitialContent() + "</div>");
            } else {
                Y.later(500, this, function() {
                    var content = this.getInitialContent();
                    if (this.editor) {
                        if (content != this._initialContent) {
                            this._initialContent = content;
                            this.editor.setContent(content);
                        }
                    } else {
                        //debugger;
                    }
                    this.updateCounters();
                    /*var tmceI = tinyMCE.get(this.get("contentBox").one(".wegas-text-input-editor"));
                     if (tmceI) {
                     tmceI.setContent(this.getInitialContent());
                     }*/

                });
            }
        },
        getInitialContent: function() {
            return this.get("variable.evaluated").getInstance().get("value");
        },
        setStatus: function(msg, item, klass) {
            item = item || "status";
            klass = klass || "";
            if (this.get("showStatus")) {
                this.get("contentBox").one("." + item).setContent("<p class=\"" + klass + "\">" + msg + "</p>");
            }
        },
        _onChange: function() {
            this.setStatus("Not saved");
            this.updateCounters();
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
        getStats: function() {
            var body = this.editor.getContent(),
                countEmpty = this.get("countBlank"),
                stats = {};

            // Remove ML tags
            body = body.replace(/<[^>]*>/g, "");

            // Convert HTML entities to dummy characters
            body = body.replace(/&nbsp;/g, " ").replace(/&[a-zA-Z]*;/g, "X");

            if (countEmpty) {
                stats.cc = body.length;
            } else {
                stats.cc = body.replace(/\s+/g, "").length;
            }
            body = body.replace(/\s+/g, " ").trim(); // TRIMLIKE
            if (body === "") {
                stats.wc = 0
            } else {
                stats.wc = body.split(" ").length;
            }
            return stats;
        },
        updateCounters: function() {
            var maxW, maxC, stats, valid = true;
            maxW = this.get("maxNumberOfWords");
            maxC = this.get("maxNumberOfCharacters");
            if (maxW || maxC) {
                stats = this.getStats();
                if (maxW) {
                    if (stats.wc > maxW) {
                        valid = false;
                    }
                    this.setStatus(stats.wc + "/" + maxW, "wc", (stats.wc > maxW ? "invalid" : "valid"));
                }
                if (maxC) {
                    if (stats.cc > maxC) {
                        valid = false;
                    }
                    this.setStatus(stats.cc + "/" + maxC, "cc", (stats.cc > maxC ? "invalid" : "valid"));
                }
            }
            return valid;
        },
        onSave: function() {
            var value = this.editor.getContent(),
                valid, msg;
            valid = true || this.updateCounters(); // Fixme do something... (prevent saving or not...)
            if (valid) {
                msg = (this.save(value) ? "Saved" : "Something went wrong");
            } else {
                msg = "Size limit exceeded";
            }
            this.setStatus(msg);
        },
        save: function(value) {
            var desc = this.get("variable.evaluated"),
                theVar = desc.getInstance(),
                cb = this.get("contentBox");
            this._initialContent = value;
            cb.addClass("loading");
            theVar.set("value", value);
            Y.Wegas.Facade.Variable.cache.put(theVar.toObject(), {
                on: {
                    success: Y.bind(function() {
                        cb.removeClass("loading");
                        this.fire("save", {
                            descriptor: desc,
                            value: value
                        });
                    }, this),
                    failure: Y.bind(function() {
                        cb.removeClass("loading");
                    }, this)
                }
            });


            return true;
        },
        getEditorLabel: function() {
            return "TextInput";
        },
        destructor: function() {
            try {
                this.editor && this.editor.remove();
            } catch (e) {
                console.debug(e);
            }
            this.editor = null;
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
            },
            label: {
                type: "string",
                optional: true
            },
            maxNumberOfCharacters: {
                type: "number",
                optional: true,
                value: undefined
            },
            maxNumberOfWords: {
                type: "number",
                optional: true,
                value: undefined
            },
            countBlank: {
                type: "boolean",
                optional: true,
                value: false
            },
            disablePaste: {
                type: "boolean",
                optional: true,
                value: false
            }
        }
    });
    Y.Wegas.TextInput = TextInput;



    StringInput = Y.Base.create("wegas-string-input", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"wegas-input-label\"></div>" +
            "<div class=\"wegas-input-text\"></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this._initialValue = undefined;
            this.publish("save", {
                emitFacade: true
            });
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        /**
         * Try to save value.
         * @param {type} value the new value to save
         * @returns {Boolean} true is the value has been saved, false otherwise
         */
        updateValue: function(value) {
            var desc = this.get("variable.evaluated"),
                inst = desc.getInstance(),
                cb = this.get("contentBox"),
                allowedValues = desc.get("allowedValues");
            if (allowedValues && allowedValues.length > 0) {
                if (!Y.Array.find(allowedValues, function(item) {
                    return item === value;
                }, this)) {
                    this.showMessage("error", Y.Wegas.I18n.t('errors.prohibited', {value: value, values: allowedValues}));
                    return false;
                }
            }

            if (inst.get("value") !== value) {
                cb.addClass("loading");
                inst.set("value", value);
                Y.Wegas.Facade.Variable.cache.put(inst.toObject(), {
                    on: {
                        success: Y.bind(function() {
                            cb.removeClass("loading");
                            this.fire("save", {
                                descriptor: desc,
                                value: value
                            });
                        }, this),
                        failure: Y.bind(function() {
                            cb.removeClass("loading");
                        }, this)
                    }
                });
            }
            return true;
        },
        renderUI: function() {
            var desc = this.get("variable.evaluated"),
                inst = desc.getInstance(),
                allowedValues = desc.get("allowedValues"),
                CB = this.get("contentBox"),
                input = CB.one(".wegas-input-text"),
                label = CB.one(".wegas-input-label"),
                i, value, content;
            if (this.get("label")) {
                label.setContent(this.get("label"));
            }

            if (allowedValues && allowedValues.length > 0) {
                // SELECT
                content = ['<select>'];
                content.push("<option value=\"\" disabled selected>--select--</option>");
                for (i in allowedValues) {
                    value = allowedValues[i];
                    content.push("<option value=\"" + value + "\" " +
                        (value === inst.get("value") ? "selected=''" : "") +
                        ">" + value + "</option>");
                }
                content.push('</select>');
                input.setContent(content.join(""));
            } else {
                // INPUT
                input.setContent("<input value=\"" + value + "\" />");
            }
        },
        syncUI: function() {
            var desc = this.get("variable.evaluated"),
                allowedValues = desc.get("allowedValues"),
                inst = desc.getInstance(),
                CB = this.get("contentBox"),
                value = inst.get("value"),
                readonly = this.get("readonly.evaluated"),
                input, select, option, i;
            if (allowedValues && allowedValues.length > 0) {
                select = CB.one("select");
                select.set("disabled", readonly);
                if (this._initialValue !== value) {
                    this._initialValue = value;
                    option = select.one("option[value='" + value + "']");
                    option && option.setAttribute("selected");
                }

                if (readonly && this.get("displayChoicesWhenReadonly")) {
                    //CB.one("select").addClass("hidden");
                    input = CB.one(".wegas-input-text");
                    input.all("ul").each(function(ul) {
                        ul.remove();
                    });
                    select = ["<ul>"];
                    for (i in allowedValues) {
                        option = allowedValues[i];
                        select.push("<li class=\"", (value === option ? "selected" : "unselected") + "\">", option, "</li>");
                    }
                    select.push("</ul>");
                    input.append(select.join(""));
                }

            } else {
                input = CB.one("input");
                input.set("disabled", readonly);
                if (this._initialValue !== value) {
                    this._initialValue = value;
                    input.set("value", value);
                }
            }
        },
        bindUI: function() {
            var input, select;
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
            input = this.get(CONTENTBOX).one("input");
            if (input) {
                this.handlers.push(input.on("blur", this.updateFromInput, this));
            }
            select = this.get(CONTENTBOX).one("select");
            if (select) {
                this.handlers.push(select.on("change", this.updateFromSelect, this));
            }
        },
        updateFromSelect: function(e) {
            this.updateValue(e.target.get("value"));
        },
        updateFromInput: function(e) {
            var input = this.get(CONTENTBOX).one("input"),
                data = input.getData(),
                value = input.get("value");
            if (data.wait) {
                data.wait.cancel();
            }
            data.wait = Y.later(200, this, function() {
                data.wait = null;
                this.updateValue(value);
            });
        }
    }, {
        /** @lends Y.Wegas.StringInput */
        EDITORNAME: "StringInput",
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
                    classFilter: ["StringDescriptor"]
                }
            },
            displayChoicesWhenReadonly: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "boolean",
                value: false,
                optional: false,
                _inputex: {
                    _type: "script",
                    expects: "condition"
                }
            },
            readonly: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "boolean",
                value: false,
                optional: false,
                _inputex: {
                    _type: "script",
                    expects: "condition"
                }
            },
            label: {
                type: "string",
                optional: true
            }
        }
    });
    Wegas.StringInput = StringInput;
});
