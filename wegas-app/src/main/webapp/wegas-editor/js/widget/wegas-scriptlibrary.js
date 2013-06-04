/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-scriptlibrary', function(Y) {
    var CONTENTBOX = 'contentBox',
            ScriptLibrary;
    /**
     * @name Y.Wegas.ScriptLibrary
     * @class Display a script edition field, using a Y.inputEx.AceField
     * @constructor
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     */
    ScriptLibrary = Y.Base.create("wegas-scriptlibrary", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /** @lends Y.Wegas.ScriptLibrary# */

        CONTENT_TEMPLATE: "<div><div class=\"empty\">No file found, click the \"New\" button to create one.</div></div>",
        /**
         * @field
         * @private
         */
        currentScript: null,
        /**
         * @function
         * @private
         */
        destructor: function() {
            this.responseHandler.detach();
            this.aceField.destroy();
        },
        /**
         * @function
         * @private
         */
        renderUI: function() {
            this.aceField = new Y.inputEx.AceField({
                parentEl: this.get(CONTENTBOX),
                type: 'ace',
                height: "100%",
                language: (this.get("library") === "CSS") ? "css" : "javascript",
                value: ""
            });

            this.renderToolbar();
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            this.responseHandler = Y.Wegas.Facade.GameModel.after("response", this.syncUI, this);

            this.selectField.on("updated", function(val) {
                this.currentScript = val;
                this.syncEditor();
            }, this);

            this.aceField.once("updated", function(val) {
                this.saveButton.set("disabled", false);
            }, this);
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            var i, isEmpty = true,
                    cb = this.get(CONTENTBOX);

            while (this.selectField.choicesList.length > 0) {                   // Remove existing choices
                this.selectField.removeChoice({
                    position: 0
                });
            }

            for (i in this.getLibrary()) {
                if (!this.currentScript) {
                    this.currentScript = i;
                }
                this.selectField.addChoice({
                    value: i
                });
                isEmpty = false;
            }

            if (isEmpty) {
                this.selectField.addChoice({
                    value: null,
                    label: "No scripts"
                });
                this.aceField.hide();

            } else {
                this.aceField.show();
                this.selectField.setValue(this.currentScript, false);
            }

            this.saveButton.set("disabled", isEmpty);
            this.deleteButton.set("disabled", isEmpty);
            cb.one(".empty").set("visible", isEmpty);

            this.hideOverlay();
        },
        // *** Private Methods *** //


        /**
         * @function
         * @private
         */
        syncEditor: function() {
            var library = this.getLibrary(),
                    selected = this.selectField.getValue(),
                    val = (library[selected]) ? library[selected].get("val.content") || "" : "";

            this.aceField.setValue(val, false);
        },
        getLibrary: function() {
            var cGameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                    mapping = {
                "Script": "scriptLibrary",
                "ClientScript": "clientScriptLibrary",
                "CSS": "cssLibrary"
            };

            return cGameModel.get(mapping[this.get("library")]);
        },
        /**
         * @function
         * @private
         */
        renderToolbar: function() {
            this.plug(Y.Plugin.WidgetToolbar);

            var toolbarNode = this.toolbar.get('header');

            this.newButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>New",
                on: {
                    click: Y.bind(function() {
                        this.currentScript = prompt("Enter a name:");

                        this.showOverlay();

                        Y.Wegas.Facade.GameModel.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel")
                                    + "/Library/" + this.get("library") + "/" + this.currentScript,
                            cfg: {
                                method: "POST",
                                data: {
                                    "@class": "GameModelContent"
                                }
                            },
                            on: {
                                success: Y.bind(function() {
                                    this.showMessage("success", "Script created");
                                }, this),
                                failure: Y.bind(function() {
                                    this.showMessage("error", "Error while saving script.");
                                }, this)
                            }
                        });
                    }, this)
                }
            }).render(toolbarNode);

            this.selectField = new Y.inputEx.SelectField({
                choices: [{
                        value: null,
                        label: "loading..."
                    }],
                parentEl: toolbarNode
            });

            if (this.get("library") === "CSS") {
                this.previewButton = new Y.Button({
                    label: "<span class=\"wegas-icon wegas-icon-preview\" ></span>Preview",
                    on: {
                        click: Y.bind(function() {
                            this.updateLoadedSheet(this.currentScript, this.aceField.getValue());
                        }, this)
                    }
                }).render(toolbarNode);
            }

            this.saveButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save",
                on: {
                    click: Y.bind(function() {
                        this.showOverlay();

                        Y.Wegas.Facade.GameModel.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel")
                                    + "/Library/" + this.get("library") + "/" + this.selectField.getValue(),
                            cfg: {
                                method: "POST",
                                data: {
                                    "@class": "GameModelContent",
                                    content: this.aceField.getValue()
                                }
                            },
                            on: {
                                success: Y.bind(function() {
                                    this.showMessage("success", "Script saved");

                                    if (this.get("library") === "CSS") {
                                        this.updateLoadedSheet(this.currentScript, this.aceField.getValue());
                                    }
                                }, this),
                                failure: Y.bind(function() {
                                    this.showMessage("error", "Error while saving script");
                                }, this)
                            }
                        });
                    }, this)
                }
            }).render(toolbarNode);

            this.deleteButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-delete\"></span>Delete",
                on: {
                    click: Y.bind(function() {
                        this.showOverlay();

                        Y.Wegas.Facade.GameModel.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel")
                                    + "/Library/" + this.get("library") + "/" + this.currentScript,
                            cfg: {
                                method: "DELETE"
                            },
                            on: {
                                success: Y.bind(function() {
                                    this.showMessage("success", "Script deleted");

                                    if (this.get("library") === "CSS") {
                                        this.updateLoadedSheet(this.currentScript, "");
                                    }

                                    this.currentScript = null;
                                }, this),
                                failure: Y.bind(function() {
                                    this.showMessage("error", "Error while deleting script.");
                                }, this)
                            }
                        });
                    }, this)
                }
            }).render(toolbarNode);
        },
        updateLoadedSheet: function(id, content) {
            if (Y.Plugin.CSSLoader.customCSSStyleSheet[id]) {
                Y.Plugin.CSSLoader.customCSSStyleSheet[id].disable();
            }
            Y.Plugin.CSSLoader.customCSSStyleSheet[id] = new Y.StyleSheet(content);
        }
    }, {
        ATTRS: {
            library: {
                type: "string",
                value: "Script"                                                 // Script, ClientScript or CSS
            }
        }
    });
    Y.namespace('Wegas').ScriptLibrary = ScriptLibrary;

});
