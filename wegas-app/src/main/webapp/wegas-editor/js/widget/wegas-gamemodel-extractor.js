/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
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
        inputEx = Y.inputEx, GmExtractor, GmExtractorAction, GmExtractorModal, GmDefaulterAction;

    GmExtractor = Y.Base.create("wegas-gm-extractor", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        BOUNDING_TEMPLATE: '<div class="wegas-form"></div>',
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                game = this.get("game"),
                freeForAll = game.get("properties.freeForAll"),
                cfg, options = [{label: "-select-", value: "-1"}], spacer = "";

            if (!freeForAll) {
                spacer = "&nbsp;&nbsp;";
            }

            Y.Array.each(game.get("teams"), function(t) {
                if (!freeForAll) {
                    options.push({
                        label: t.get("name"),
                        value: -1
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

            cfg = {
                type: "group",
                parentEl: cb,
                fields: [{
                        name: "playerId",
                        type: "select",
                        label: "Based on",
                        choices: options
                    }]
            };

            inputEx.use(cfg, Y.bind(function() {
                this._form = new inputEx(cfg);
            }, this));

            cb.append('<div><div class="results wegas-advanced-feature"></div><div class="status"></div></div>');
        },
        syncUI: function() {
            this.get("contentBox").one("select").all("option[value='-1']").setAttribute("disabled", true);
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
                                window.open(Wegas.app.get("base") + "edit.html?gameModelId=" + e.response.entities[0].get("id"));
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
                this.set("title", "Create A New Scenario Based On A Player");
                this.set("icon", game.get("properties.freeForAll") ? "user" : "group");
                this.add(new Y.Wegas.GmExtractor({
                    "game": game,
                    "mode": this.get("mode")
                }));
                this.set("actions", actions);
            }
        }
    }, {
        ATTRS: {
            mode: {
                type: "string",
                value: "Create"
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
                "mode": "Update"
            }).render();
        }
    }, {
        NS: "GmDefaulterAction"
    });
    Y.Plugin.GmDefaulterAction = GmDefaulterAction;
});
