/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


YUI.add('wegas-model-propagator', function(Y) {
    'use strict';
    var ModelPropagator, ModelPropagatorModal, ModelPropagatorAction;

    ModelPropagator = Y.Base.create("wegas-model-propagator", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        renderUI: function() {
            this.add(new Y.Wegas.Text({
                cssClass: "modal-title",
                content: "Please review diff"
            }));

            this.content = new Y.Wegas.Text({
                cssClass: "modal-content",
                content: "Diff is loading..."
            })
            this.add(this.content);

            this.waitForDiff = true;

            Y.Wegas.Facade.GameModel.sendRequest({
                request: "/" + this.get("gameModel").get("id") + "/Diff",
                cfg: {
                    updateCache: false,
                },
                on: {
                    success: Y.bind(this.syncDiff, this)
                }
            });
        },
        _genOutput: function(diff) {
            var output = "<div class='diff'>";
            if (diff.title) {
                output += "<span class='diff-title'>" + diff.title + "</span>";
            }

            if (diff.diffs) {
                for (var i in diff.diffs) {
                    output += this._genOutput(diff.diffs[i]);
                }
            }

            if (diff.changes) {
                for (var i in diff.changes) {
                    var change = diff.changes[i];
                    if (change.lineNumber || change.content) {
                        output += "<div class='change'>";
                        if (diff.changes.length > 1) {
                            output += "<span class='line-number'>" + change.lineNumber + "</span>";
                        }
                        output += "<pre class='line-change change-tag-" + change.tag + "'>" + change.content + "</pre>";
                        output += "</div>";
                    } else {
                        output += "<div class='side2side-change'>";
                        output += "<pre class='old'>" + change.oldValue + "</pre>";
                        output += "<pre class='new'>" + change.newValue + "</pre>";
                        output += "</div>";
                    }
                }
            }
            output += "</div>";
            return output;
        },
        syncDiff: function(response) {
            if (response.response.entity) {
                var diff = response.response.entity.get("val");
                this.content.setContent(this._genOutput(diff));
            } else {
                this.content.setContent("Nothing to propagate");
            }
            this.waitForDiff = false;
        },
        propagate: function() {
            if (!this.waitForDiff) {
                this.get("contentBox").setContent("Propagate Model to senarios:");
                Y.Wegas.Facade.GameModel.sendRequest({
                    request: "/" + this.get("gameModel").get("id") + "/Propagate",
                    cfg: {
                        method: "PUT",
                        updateCache: false
                    },
                    on: {
                        success: Y.bind(function(e) {
                            Y.Wegas.Alerts.showNotification("Successfull propagation", {
                                timeout: 2500
                            });
                            this.fire("model:propagated");
                        }, this),
                        failure: Y.bind(function(e) {
                            this.fire("model:propagationFailed");
                            var events = e.serverResponse.get("events");
                            for (var i in events) {
                                var event = events[i];


                                this.content.set("content", "");
                                this.content.syncUI();
                                if (event.get("@class") === "ExceptionEvent") {
                                    for (var j in event.get("val").exceptions) {
                                        var exception = event.get("val").exceptions[j];
                                        this.content.get("contentBox").append("<p>" +
                                            exception.get("val").message
                                            + "</p>");
                                    }
                                }
                            }
                        }, this)
                    }
                });
            }
        }
    }, {
        ATTRS: {
            gameModel: {
                type: "Object"
            }
        }
    });
    Y.Wegas.ModelPropagator = ModelPropagator;

    ModelPropagatorModal = Y.Base.create("wegas-model-propagator-modal", Y.Wegas.Modal, [], {
        initializer: function() {
            var gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                actions;

            if (gameModel) {
                actions = [{
                        "types": ["primary"],
                        "label": "<span class='propagatebutton'><i class='fa fa-rocket'> Propagate</span>",
                        "do": function() {
                            this.get("modalBox").one(".propagatebutton").toggleClass("loading", true);
                            this.item(0).propagate();
                        }
                    }, {
                        "label": 'Cancel',
                        "do": function() {
                            this.close();
                        }
                    }];
                this.set("title", "Propagate Model");
                this.set("icon", "cubes");
                this.add(new Y.Wegas.ModelPropagator({
                    "gameModel": gameModel
                }));
                this.set("actions", actions);
            }
        }
    }, {
        ATTRS: {
            mode: {
                type: "string",
                value: "Create"
            },
            title: {
                type: "string",
                value: "Propagate Model to implementations"
            }
        }
    });
    Y.Wegas.ModelPropagatorModal = ModelPropagatorModal;



    ModelPropagatorAction = Y.Base.create("ModelPropagatorAction", Y.Plugin.Action, [], {
        execute: function() {
            new Y.Wegas.ModelPropagatorModal({
                "on": {
                    "model:propagated": function() {
                        this.close();
                    },
                    "model:propagationFailed": function() {
                        this.get("modalBox").one(".propagatebutton").toggleClass("loading", false);
                    }
                }
            }).render();
        }
    }, {
        NS: "ModelPropagatorAction"
    });
    Y.Plugin.ModelPropagatorAction = ModelPropagatorAction;

});