/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add('wegas-gamemodel-extractor', function(Y) {
    'use strict';
    var Wegas = Y.Wegas,
        CONTENTBOX = "contentBox",
        GmExtractor, GmExtractorAction, GmExtractorModal, GmDefaulterAction;

    GmExtractor = Y.Base.create("wegas-gm-extractor", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        BOUNDING_TEMPLATE: '<div class="wegas-form"></div>',
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                game = this.get("game"),
                freeForAll = game.get("properties.freeForAll"),
                options = [{
                        label: "-select-",
                        value: "-1",
                        disabled: true
                    }], spacer = "";

            if (!freeForAll) {
                spacer = " ";
            }

            Y.Array.each(game.get("teams"), function(t) {
                if (!freeForAll) {
                    options.push({
                        label: t.get("name"),
                        disabled: true,
                        value: t.get("id")
                    });
                }
                Y.Array.each(t.get("players"), function(p) {
                    options.push(
                        {
                            label: spacer + p.get("name"),
                            value: p.get("id")
                        });
                }, this);
            }, this);

            this.cfg = {
                type: "object",
                properties: {
                    "playerId": {
                        type: "number",
                        view: {
                            label: "Based on",
                            type: "select",
                            choices: options
                        }
                    }
                }
            };


            this._form = new Y.Wegas.RForm({
                values: {},
                cfg: this.cfg
            });
            this._form.render(cb);

            cb.append('<div><div class="results wegas-advanced-feature"></div><div class="status"></div></div>');
        },
        syncUI: function() {
        },
        setStatus: function(status) {
            this.get("contentBox").one(".status").set("text", status);
        },
        create: function() {
            var playerId = this._form.getValue().playerId,
                player = Y.Wegas.Facade.Game.cache.getPlayerById(playerId),
                game = this.get("game"),
                freeForAll = game.get("properties.freeForAll"),
                msg,
                mode = this.get("mode");

            if (!this.validate()) {
                this.setStatus("Please select a player");
                return;
            }

            if (mode === "Create") {
                msg = "This will create a new scenario based on the player named \"" + player.get("name") + "\"";
            } else {
                msg = "This will erase all default instances with values from the player named \"" + player.get("name") + "\"";
            }
            if (!freeForAll) {
                msg += " from the team \"" + player.get("team").get("name") + "\"";
            }
            msg += ". Proceed ?";

            Wegas.Panel.confirm(msg, Y.bind(function() {
                this.setStatus("Creating...");
                this.showOverlay();
                Wegas.Facade.GameModel.sendRequest({
                    request: "/" + this.get("game").get("gameModelId") + "/" + this.get("mode") + "FromPlayer/" + playerId,
                    cfg: {
                        method: "POST",
                        updateEvent: false
                            //data: this._form.getValue()
                    },
                    on: {
                        success: Y.bind(function(e) {
                            this.setStatus("OK");
                            Y.later(1000, this, function() {
                                this.hideOverlay();
                                if (this.get("openPopup")) {
                                    window.open(Wegas.app.get("base") + "edit.html?gameModelId=" + e.response.entities[0].get("id"));
                                }
                                this.fire("gamemodel:created");
                            });
                        }, this),
                        failure: Y.bind(function() {
                            this.hideOverlay();
                            this.setStatus("Something went wrong");
                        }, this)
                    }
                }, this);
            }, this));
        },
        validate: function() {
            var playerId = this._form.getValue().playerId,
                player = Y.Wegas.Facade.Game.cache.getPlayerById(playerId);
            return player !== undefined;
        },
        destructor: function() {
            this._form && this._form.destroy();
            this._form = null;
        }
    }, {
        ATTRS: {
            game: {
                type: "object"
            },
            mode: {
                type: "string",
                value: "Create"
            },
            openPopup: {
                type: "boolean",
                value: "true"
            }
        }
    });
    Y.Wegas.GmExtractor = GmExtractor;

    GmExtractorModal = Y.Base.create("wegas-gmextractor-modal", Y.Wegas.Modal, [], {
        initializer: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                actions;

            if (game) {
                actions = [{
                        "types": ["primary"],
                        "label": "Create",
                        "do": function() {
                            this.item(0).create();
                        }
                    }, {
                        "label": 'Cancel',
                        "do": function() {
                            this.close();
                        }
                    }];
                this.set("title", this.get("title"));
                this.set("icon", game.get("properties.freeForAll") ? "user" : "group");
                this.add(new Y.Wegas.GmExtractor({
                    "game": game,
                    "mode": this.get("mode"),
                    "openPopup": this.get("openPopup")
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
                value: "Create A New Scenario Based On A Player"
            },
            openPopup: {
                type: "boolean",
                value: true
            }
        }
    });
    Y.Wegas.GmExtractorModal = GmExtractorModal;

    GmExtractorAction = Y.Base.create("GmExtractorAction", Y.Plugin.Action, [], {
        execute: function() {
            new Y.Wegas.GmExtractorModal({
                "on": {
                    "gamemodel:created": function() {
                        this.close();
                    }
                },
                "mode": "Create"
            }).render();
        }
    }, {
        NS: "GmExtractorAction"
    });
    Y.Plugin.GmExtractorAction = GmExtractorAction;

    GmDefaulterAction = Y.Base.create("GmDefaulterAction", Y.Plugin.Action, [], {
        execute: function() {
            new Y.Wegas.GmExtractorModal({
                "on": {
                    "gamemodel:created": function() {
                        this.close();
                    }
                },
                "mode": "Update",
                "title": "Reset default instances. DO NOT USE THIS FUNCTIONNALITIES UNLESS YOU FULLY UNDERSTAND WHAT YOU ARE DOING !!!",
                "openPopup": false
            }).render();
        }
    }, {
        NS: "GmDefaulterAction"
    });
    Y.Plugin.GmDefaulterAction = GmDefaulterAction;
});
