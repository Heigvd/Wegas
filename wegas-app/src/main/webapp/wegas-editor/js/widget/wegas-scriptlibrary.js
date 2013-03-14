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
YUI.add('wegas-scriptlibrary', function (Y) {
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
    ScriptLibrary = Y.Base.create("wegas-scriptlibrary", Y.Widget, [Y.WidgetChild,  Y.Wegas.Widget], {
        /** @lends Y.Wegas.ScriptLibrary# */

        /**
         * @field
         * @private
         */
        currentScript: null,

        /**
         * @function
         * @private
         */
        destructor: function () {
            this.responseHandler.detach();
        },

        /**
         * @function
         * @private
         */
        renderUI: function () {
            this.aceField = new Y.inputEx.AceField({
                parentEl: this.get(CONTENTBOX),
                type: 'ace',
                height: "100%",
                language: "javascript",
                value: ""
            });

            this.renderToolbar();
        },

        /**
         * @function
         * @private
         */
        bindUI: function () {
            this.responseHandler = Y.Wegas.app.dataSources.GameModel.after("response", this.syncUI, this);

            this.selectField.on("updated", function (val) {
                this.currentScript = val;
                this.syncEditor();
            }, this);

            this.aceField.once("updated", function (val) {
                this.saveButton.set("disabled", false);
            }, this);
        },

        /**
         * @function
         * @private
         */
        syncUI: function () {
            var i, cGameModel = Y.Wegas.GameModelFacade.cache.getCurrentGameModel(),
            isEmpty = true;

            if (!cGameModel) {
                return;
            }

            while (this.selectField.choicesList.length > 0) {
                this.selectField.removeChoice({
                    position: 0
                });
            }
            for (i in cGameModel.get("scriptLibrary")) {
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
            } else {
                this.selectField.setValue(this.currentScript, false);
            }

            this.saveButton.set("disabled", isEmpty);
            this.deleteButton.set("disabled", isEmpty);

            this.hideOverlay();
        },

        // *** Private Methods *** //

        /**
         * @function
         * @private
         */
        renderToolbar: function () {
            this.plug(Y.Plugin.WidgetToolbar);

            var toolbarNode = this.toolbar.get('header');

            this.newButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>New",
                on: {
                    click: Y.bind(function () {
                        this.currentScript = prompt("Script name:");

                        this.showOverlay();

                        Y.Wegas.app.dataSources.GameModel.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel") + "/ScriptLibrary/" + this.currentScript,
                            cfg: {
                                method: "POST",
                                data: ""
                            },
                            on: {
                                success: Y.bind(function () {
                                    this.showMessage("success", "Script created");
                                }, this),
                                failure: Y.bind(function () {
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

            this.saveButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save",
                on: {
                    click: Y.bind(function () {
                        this.showOverlay();

                        Y.Wegas.app.dataSources.GameModel.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel") + "/ScriptLibrary/" + this.selectField.getValue(),
                            cfg: {
                                method: "POST",
                                data: this.aceField.getValue()
                            },
                            on: {
                                success: Y.bind(function () {
                                    this.showMessage("success", "Script saved");
                                }, this),
                                failure: Y.bind(function () {
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
                    click: Y.bind(function () {
                        this.showOverlay();

                        Y.Wegas.app.dataSources.GameModel.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel") + "/ScriptLibrary/" + this.currentScript,
                            cfg: {
                                method: "DELETE"
                            },
                            on: {
                                success: Y.bind(function () {
                                    this.showMessage("success", "Script deleted");
                                }, this),
                                failure: Y.bind(function () {
                                    this.showMessage("error", "Error while deleting script.");
                                }, this)
                            }
                        });
                        this.currentScript = null;
                    }, this)
                }
            }).render(toolbarNode);
        },

        /**
         * @function
         * @private
         */
        syncEditor: function () {
            var cGameModel = Y.Wegas.GameModelFacade.cache.getCurrentGameModel(),
            val = cGameModel.get("scriptLibrary")[this.selectField.getValue()] || "";

            this.aceField.setValue(val, false);
        }
    });
    Y.namespace('Wegas').ScriptLibrary = ScriptLibrary;

});
