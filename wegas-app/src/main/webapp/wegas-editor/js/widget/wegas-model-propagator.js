/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


YUI.add('wegas-model-propagator', function(Y) {
    'use strict';
    var ModelPropagator, ModelPropagatorModal, ModelPropagatorAction;

    ModelPropagator = Y.Base.create("wegas-model-propagator", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        renderUI: function() {
            this.add(new Y.Wegas.Text({
                content: "Propagate Model to senarios:"
            }));
        },
        propagate: function() {
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
                        var cb = this.get("contentBox");
                        this.fire("model:propagationFailed");
                        var events = e.serverResponse.get("events");
                        for (var i in events) {
                            var event = events[i];

                            if (event.get("@class") === "ExceptionEvent") {
                                for (var j in event.get("val").exceptions) {
                                    var exception = event.get("val").exceptions[j];
                                    cb.append("<p>" +
                                        exception.get("val").message
                                        + "</p>");
                                }
                            }
                        }
                    }, this)
                }
            });
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