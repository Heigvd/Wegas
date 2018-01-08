/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-console', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox';

    Y.Wegas.Console = Y.Base.create("wegas-console", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        renderUI: function() {
            this.plug(Y.Plugin.WidgetToolbar);

            var cb = this.get(CONTENTBOX);

            this.srcField = new Y.inputEx.AceField({
                parentEl: cb,
                typeInvite: 'Enter script here',
                rows: 7
            });
            cb.append('<div class="results"></div>');

            this.renderRunButton();
        },
        destructor: function() {
            this.srcField.destroy();
        },
        executeScript: function(scriptEntity, player) {
            this.showOverlay();
            Y.Wegas.Facade.Variable.script.run(scriptEntity, {
                on: {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result">Script executed. Returned value: ' +
                            Y.JSON.stringify(e.response.entities[0]) +
                            "</div>");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result error">Error executing script: ' +
                            e.response.results.message + "</div>");
                    }, this)
                }
            }, player);
        },
        multiExecuteScript: function(multiPlayerScript) {
            this.showOverlay();
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/Script/Multirun",
                cfg: {
                    method: "POST",
                    data: multiPlayerScript
                },
                on: {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("success", "The impact has been successfully completed", 4000);
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result">Script executed. Returned value: ' +
                            Y.JSON.stringify(e.response.entities[0]) +
                            "</div>");
                        if (!this.get("boundingBox").hasClass("wegas-editor-console")) {
                            this.srcField.setValue();
                            this.srcField.addButton.getNode().simulate("click");
                        }
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        var res = e.response && e.response.results;
                        if (res && res.exception === "com.wegas.core.exception.ScriptException") {
                            this.showMessage("error", res.message, 4000);
                        } else {
                            this.showMessage("error", "An error has occurred, please retry again", 4000);
                        }
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result error">Error executing script: ' +
                            res.message + "</div>");
                    }, this)
                }
            });
        },
        /**
         * @function
         * @private
         * @description Create and render the button for run the script.
         */
        renderRunButton: function() {
            this.toolbar.add(new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>Run",
                on: {
                    click: Y.bind(function() {
                        if (!this.srcField.validate()) {
                            this.showMessage("error", "Some fields are invalid", 1000);
                            return;
                        }
                        var playerList = this.getPlayerList(),
                            multiPlayerScript = {
                                playerIdList: playerList,
                                script: {
                                    "@class": "Script",
                                    language: "JavaScript",
                                    content: this.srcField.getValue().content
                                }
                            };
                        if (playerList.length === 0) {
                            return;
                        }

                        this.multiExecuteScript(multiPlayerScript);

                        // Single user version
                        //this.executeScript({
                        //    "@class": "Script",
                        //    language: "JavaScript",
                        //    content: this.srcField.getValue()
                        //});
                    }, this)
                }
            }));
        }
    });
});
