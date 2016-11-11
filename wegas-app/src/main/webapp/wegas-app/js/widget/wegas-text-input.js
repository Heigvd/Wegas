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
            this.publish("saved", {
                emitFacade: true
            });
            this.publish("save", {
                emitFacade: true
            });
            this.publish("editing", {
                emitFacade: true
            });
        },
        /**
         * @function
         * @private
         */
        renderUI: function() {
            var CB = this.get("contentBox");
            this._descriptor = this.get("variable.evaluated");
//            Y.once("domready", function() {
            if (this.get("label")) {
                CB.one(".wegas-input-label").setContent(this.get("label"));
            }
            if (this.get("maxNumberOfCharacters")) {
                this.get("contentBox").one(".wegas-text-input-editor").setAttribute("data-maxChars", this.get("maxNumberOfCharacters"));
            }

            if (this.get("readonly.evaluated")) {
                CB.one(".wegas-text-input-editor").setContent("<div class=\"readonly\">" + this.getInitialContent() + "</div>");
            } else {
                Y.once("domready", function() {
                    //this.editor = new tinymce.Editor(this.get("contentBox").one(".wegas-text-input-editor").getDOMNode(),
                    if (this.editor) {
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
                        toolbar1: this.get("toolbar1"),
                        toolbar2: this.get("toolbar2"),
                        toolbar3: this.get("toolbar3"),
                        contextmenu: this.get("contextmenu"),
                        // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect fontsizeselect styleselect spellchecker template
                        menubar: false,
                        statusbar: false,
                        relative_urls: false,
                        toolbar_items_size: 'small',
                        hidden_tootlbar: [2, 3],
                        setup: Y.bind(function(editor) {

                            if (this.get("disablePaste")) {
                                editor.on('paste', function(e) {
                                    e.preventDefault();
                                });
                            }
                            // Update on editor update
                            editor.on('change', Y.bind(this._onChange, this)); // click on taskbar buttons
                            editor.on('keyUp', Y.bind(this._onChange, this)); // text input & ctrl-related operations
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
        getPayload: function(value) {
            var desc = this._descriptor || this.get("variable.evaluated");

            return {
                descriptor: desc,
                value: value
            };
        },
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Instance.after("updatedInstance", function(e) {
                var text = this.get("variable.evaluated");
                if (text && text.getInstance().get("id") === e.entity.get("id")) {
                    this.syncUI();
                }
            }, this));
            this.on("save", this._save);
        },
        syncUI: function() {
            this.setContent();
        },
        setContent: function() {

            if (this.get("readonly.evaluated")) {
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
            var content = this.editor.getContent(),
                desc = this.get("variable.evaluated");
            this.setStatus("Not saved");
            this.updateCounters();
            this.fire("editing", this.getPayload(content));
            this.valueChanged(content);
            if (!this.get("showSaveButton")) {
                if (this.wait) {
                    this.wait.cancel();
                }
                if (this.get("selfSaving")) {
                    this.wait = Y.later(1000, this, function() {
                        this.wait = null;
                        this.onSave();
                    });
                } else {
                    this.onSave();
                }
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
            if (!this.editor)
                return; // Is null when save timeout occurs too late (e.g. after leaving the current page).
            var value = this.editor.getContent(),
                valid, msg;
            valid = true || this.updateCounters(); // Fixme do something... (prevent saving or not...)
            if (valid) {
                msg = (this.save(value) ? "Saving..." : "Something went wrong");
            } else {
                msg = "Size limit exceeded";
            }
            this.setStatus(msg);
        },
        _save: function(e) {
            var value = e.value,
                theVar = e.descriptor.getInstance();
            if (this.get("selfSaving")) {
                if (!this.waitForValue) {
                    this.processSave(value, e.descriptor);
                } else {
                    this.queuedValue = {
                        value: value,
                        descriptor: e.descriptor
                    };
                }
            } else {
                this._initialContent = value;
                theVar.set("value", value);
                this.setStatus("Saved");
                this._saved(value);
            }
        },
        processSave: function(value, descriptor) {
            var theVar = descriptor.getInstance(),
                cb = this.get("contentBox");

            this.waitForValue = value;
            this._initialContent = value;
            theVar.set("value", value);

            Wegas.Facade.Variable.script.remoteEval("Variable.find(gameModel, \"" + descriptor.get("name") + "\").setValue(self, " + JSON.stringify(value) + ");", {
                on: {
                    success: Y.bind(function() {
                        cb.removeClass("loading");
                        this.setStatus("Saved");
                        this._saved(value);
                    }, this),
                    failure: Y.bind(function() {
                        cb.removeClass("loading");
                        this.setStatus("Something went wrong");
                        this._saved(value);
                    }, this)
                }
            });
        },
        _saved: function(value) {
            this.fire("saved", this.getPayload(value));

            if (this.waitForValue === value) {
                this.waitForValue = null;
                if (this.queuedValue) {
                    this.processSave(this.queuedValue.value, this.queuedValue.descriptor);
                }
            }
        },
        save: function(value) {
            var desc = this.get("variable.evaluated"),
                cb = this.get("contentBox");

            if (this.get("selfSaving")) {
                cb.addClass("loading");
            }
            this.fire("save", this.getPayload(value));
            return true;
        },
        getEditorLabel: function() {
            return "TextInput";
        },
        destructor: function() {
            if (this.wait) {
                this.wait.cancel();
                this.onSave();
            }
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
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "boolean",
                value: {"content": "return false;"},
                optional: true,
                _inputex: {
                    _type: "script",
                    expects: "condition"
                }
            },
            showSaveButton: {
                type: "boolean",
                value: true,
                optional: true
            },
            selfSaving: {
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
            },
            toolbar1: {
                type: "string",
                value: "bold italic bullist | link code addToolbarButton",
                optionnal: true
            },
            toolbar2: {
                type: "string",
                value: "forecolor backcolor underline alignleft aligncenter alignright alignjustify table",
                optionnal: true
            },
            toolbar3: {
                type: "string",
                value: "fontselect fontsizeselect styleselect",
                optionnal: true
            },
            contextmenu: {
                type: "string",
                value: "link image inserttable | cell row column deletetable | formatselect forecolor",
                optionnal: true
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
            this.publish("editing", {
                emitFacade: true
            });
            /* to be fired if content is edited and canceled in a shot */
            this.publish("revert", {
                emitFacade: true
            });
            this.publish("saved", {
                emitFacade: true
            });
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        getPayload: function(value) {
            var desc = this._descriptor || this.get("variable.evaluated");

            return {
                descriptor: desc,
                value: value
            };
        },
        /**
         * Try to save value.
         * @param {type} value the new value to save
         * @returns {Boolean} true is the value has been saved, false otherwise
         */
        updateValue: function(value) {
            var desc = this.get("variable.evaluated"),
                inst = desc.getInstance(),
                values, iValue,
                numSelectable,
                cb = this.get("contentBox"),
                allowedValues = desc.get("allowedValues");
            if (allowedValues && allowedValues.length > 0) {
                if (!(this.get("allowNull") && value === "") && !Y.Array.find(allowedValues, function(item) {
                    return item === value;
                }, this)) {
                    this.showMessage("error", Y.Wegas.I18n.t('errors.prohibited', {value: value, values: allowedValues}));
                    return false;
                }
                numSelectable = this.get("numSelectable");
                if (numSelectable > 1) {
                    iValue = inst.get("value");
                    if (!iValue) {
                        values = [];
                    } else {
                        values = JSON.parse(iValue);
                        if (!Y.Lang.isArray(values)) {
                            values = [values];
                        }
                    }
                    if (values.indexOf(value) >= 0) {
                        values.splice(values.indexOf(value), 1);
                    } else {
                        if (values.length >= numSelectable) {
                            this.showMessage("error", Y.Wegas.I18n.t('errors.limitReached', {num: numSelectable}));
                            return false;
                        } else {
                            values.push(value);
                        }
                    }
                    value = JSON.stringify(values);
                } else {
                    // Only one value -> replace
                    value = JSON.stringify([value]);
                }
            }

            if (inst.get("value") !== value) {
                // HERE
                this._initialValue = value;
                if (this.get("selfSaving")) {
                    cb.addClass("loading");
                }
                this.fire("save", this.getPayload(value));
            } else {
                this.fire("revert", this.getPayload(value));
            }
            return true;
        },
        _save: function(e) {
            var inst = e.descriptor.getInstance(),
                cb = this.get("contentBox"),
                value = e.value;
            this._initialContent = value;
            inst.set("value", value);
            if (this.get("selfSaving")) {
                Wegas.Facade.Variable.script.remoteEval("Variable.find(gameModel, \"" + e.descriptor.get("name") + "\").setValue(self, " + JSON.stringify(value) + ");", {
                    on: {
                        success: Y.bind(function() {
                            cb.removeClass("loading");
                            this._saved(value);
                        }, this),
                        failure: Y.bind(function() {
                            cb.removeClass("loading");
                            this._saved(value);
                        }, this)
                    }
                });
            } else {
                this._saved(value);
                this.syncUI();
            }
        },
        _saved: function(value) {
            var desc = this.get("variable.evaluated");
            this.fire("saved", this.getPayload(value));
        },
        renderUI: function() {
            var desc = this.get("variable.evaluated"),
                inst = desc.getInstance(),
                allowedValues = desc.get("allowedValues"),
                CB = this.get("contentBox"),
                input = CB.one(".wegas-input-text"),
                label = CB.one(".wegas-input-label"),
                i, value, content;
            this._descriptor = desc;
            if (this.get("label")) {
                label.setContent(this.get("label"));
            }

            if (allowedValues && allowedValues.length > 0) {

                if (!this.get("clickSelect")) {
                    // SELECT
                    content = ['<select>'];
                    content.push("<option value=\"\" disabled selected>--select--</option>");
                    for (i in allowedValues) {
                        value = allowedValues[i];
                        content.push("<option value=" + JSON.stringify(value) + " " +
                            (value === inst.get("value") ? "selected=''" : "") +
                            ">" + value + "</option>");
                    }
                    content.push('</select>');
                    input.setContent(content.join(""));
                } else {
                    // CheckBox Like
                    content = ["<ul class=\"wegas-string-input-checkboxes\">"];
                    for (i in allowedValues) {
                        value = allowedValues[i];

                        content.push("<li data-value=" + JSON.stringify(value) + " " +
                            (value === inst.get("value") ? "class='selected'" : "") +
                            ">" + value + "</li>");
                    }

                    if (this.get("allowNull")) {
                        content.push("<li data-value=\"\">" + I18n.t("global.dunno") + "</li>");
                    }
                    content.push("</ul>");
                    input.setContent(content.join(""));
                }
            } else {
                // INPUT
                value = value || "";
                input.setContent("<input value=\"" + value + "\" />");
            }
        },
        syncUI: function() {
            var desc = this.get("variable.evaluated"),
                allowedValues = desc.get("allowedValues"),
                inst = desc.getInstance(),
                CB = this.get("contentBox"),
                value = inst.get("value"),
                values, i,
                readonly = this.get("readonly.evaluated"),
                input, select, option, i;
            this.get("boundingBox").toggleClass("readonly", readonly);
            if (allowedValues && allowedValues.length > 0) {
                if (!this.get("clickSelect")) {
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
                    // First deselect *
                    select = CB.one(".wegas-string-input-checkboxes");
                    select.all(".selected").removeClass("selected");
                    //if (this.get("numSelectable") > 1) {
                    if (!value) {
                        value = "[]";
                    }
                    // value shall always be an array (even an empty one!)
                    values = JSON.parse(value);
                    if (!Y.Lang.isArray(values)) {
                        values = [values];
                    }
                    for (i in values) {
                        select.all("li[data-value=\"" + values[i] + "\"]").addClass("selected");
                    }

                    //} else {
                    // value will never contains several values
                    //select.all("li[data-value=\"" + value + "\"]").addClass("selected");
                    //}
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
            var input, select, ul;
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
            input = this.get(CONTENTBOX).one("input");
            if (input) {
                //this.handlers.push(input.on("blur", this.updateFromInput, this));
                this.handlers.push(input.on("valuechange", this.keyUp, this));
            }
            select = this.get(CONTENTBOX).one("select");
            if (select) {
                this.handlers.push(select.on("change", this.updateFromSelect, this));
            }
            ul = this.get(CONTENTBOX).one("ul");
            if (ul) {
                this.handlers.push(this.get(CONTENTBOX).delegate("click", this.updateFromUl, "li", this));
            }
            this.on("save", this._save);
        },
        updateFromUl: function(e) {
            var v;
            if (!this.get("readonly.evaluated")) {
                v = JSON.parse("\"" + e.target.getData().value + "\"");
                this.updateValue(v);
            }
        },
        updateFromSelect: function(e) {
            if (!this.get("readonly.evaluated")) {
                this.updateValue(e.target.get("value"));
            }
        },
        keyUp: function(e) {
            var input = this.get(CONTENTBOX).one("input"),
                value = input.get("value");
            this.fire("editing", this.getPayload(value));
            this.updateFromInput();
        },
        updateFromInput: function(e) {
            var input = this.get(CONTENTBOX).one("input"),
                data = input.getData(),
                value = input.get("value");
            if (this.wait) {
                this.wait.cancel();
            }
            if (this.get("selfSaving")) {
                this.wait = Y.later(1000, this, function() {
                    this.wait = null;
                    this.updateValue(value);
                });
            } else {
                this.updateValue(value);
            }
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
            selfSaving: {
                type: "boolean",
                value: true,
                optional: true
            },
            clickSelect: {
                type: "boolean",
                value: false,
                optional: true
            },
            allowNull: {
                type: "boolean",
                value: true,
                optional: true
            },
            numSelectable: {
                type: "number",
                value: 1,
                optional: true
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
