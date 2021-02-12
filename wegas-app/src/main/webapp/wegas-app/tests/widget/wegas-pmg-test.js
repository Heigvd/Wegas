/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-serialization-test', function(Y) {

    var Mock = Y.Mock, Wegas = Y.Wegas;

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'Y.Wegas.SerializationTest',
        /*
         * Sets up data that is needed by each test.
         */
        setUp: function() {
            Y.io;
            debugger;
            var app, gameModelId, gameId, teamId, playerId, userId, pagesUri;
            app = new Y.Wegas.App({
                dataSources: {
                    Variable: {
                        source: "rest/GameModel/#{gameController.currentGameModel.id}/VariableDescriptor",
                        initialRequest: "",
                        plugins: [{
                                fn: "VariableDescriptorCache",
                                cfg: {
                                    indexes: ["name", "id"]
                                }
                            }, {
                                fn: "ScriptEval"
                            }
                        ]
                    },
                    Instance: {
                        source: "rest/Editor/GameModel/" + gameModelId + "/VariableDescriptor",
                        initialRequest: "/VariableInstance/AllPlayerInstances/" + playerId,
                        plugins: [{
                                fn: "VariableInstanceCache",
                                cfg: {
                                    indexes: ["descriptorId"]
                                }
                            }]
                    },
                    Page: {
                        source: pagesUri,
                        initialFullRequest: 'wegas-app/db/wegas-app-layout.json',
                        plugins: [{
                                fn: "JSONSchema"
                            }, {
                                fn: "PageCache"
                            }
                        ]
                    },
                    GameModel: {
                        source: "rest/GameModel",
                        initialRequest: gameModelId,
                        plugins: [{
                                fn: "GameModelCache",
                                cfg: {
                                    currentGameModelId: gameModelId
                                }
                            }]
                    },
                    Game: {
                        source: "rest/GameModel/" + gameModelId + "/Game",
                        initialRequest: "/" + gameId,
                        plugins: [{
                                fn: "GameCache",
                                cfg: {
                                    currentGameId: gameId,
                                    currentTeamId: teamId,
                                    currentPlayerId: playerId,
                                    indexes: ["id"]
                                }
                            }
                        ]
                    },
                    User: {
                        source: "rest/Extended/User",
                        initialRequest: "/" + userId,
                        plugins: [{
                                fn: "UserCache",
                                cfg: {
                                    currentUserId: userId
                                }
                            }]
                    },
                    Pusher: {
                        type: "PusherDataSource",
                        source: "rest/Pusher/",
                        applicationKey: "",
                        cluster: "",
                        plugins: [{
                                fn: "WebSocketListener",
                                cfg: {
                                    dataSource: "Pusher"
                                }
                            }]
                    },
                    File: {
                        source: "rest/GameModel/" + gameModelId + "/File/",
                        plugins: [{
                                fn: "JSONSchema"
                            }]
                    }
                }
            });

            Y.applyConfig(YUI_config);
            app.render();
        },
        'should instantiate and serialize PMG widgets cfg': function() {
            this.log("PMG pages");
            this.loadApp("../wegas-private/wegas-pmg/db/wegas-pmg-gameModel-simplePmg.json");
            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-private/wegas-pmg/db/wegas-pmg-pages.json");
        },
        assertJsonCfg: function(request) {

            Y.log("Sending request to " + request, "log", "Y.Wegas.SerializationTest");
            //Y.on('io:xdrReady', function() {
            Y.io(request, {
                //xdr: {
                //  use: 'flash'
                //},
                cfg: {
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8'
                    }
                },
                on: {
                    success: function(id, e) {
                        Y.log("Io success", "log", "Y.Wegas.SerializationTest");
                        this.resume(function() {
                            this.pagesAcc = Y.Object.values(Y.JSON.parse(e.responseText));
                            this.nextPage();
                        });
                    },
                    failure: function(id, e) {
                        // Y.log("Io failure", "error", "Y.Wegas.SerializationTest");
                        this.resume(function() {
                            this.pagesAcc = Y.Object.values(Y.JSON.parse(e.responseText));
                            this.nextPage();
                        });
                    }
                },
                context: this
            });

            this.wait();
        },
        /**
         *
         */
        nextPage: function() {
            if (!this.pagesAcc || this.pagesAcc.length === 0) {
                return;
            }
            var cPage = this.pagesAcc.pop();

            delete cPage["@name"];                                              // Remove @page (hacky declaration)
            Y.log("Testing page: " + Y.JSON.stringify(cPage), "log");

            this.assertUseAndRevive(cPage);
            this.wait();
        },
        /**
         *
         * @param {type} cfg
         * @returns {undefined}
         */
        assertUseAndRevive: function(cfg) {
            Y.Wegas.Widget.use(cfg, Y.bind(function(cfg) {                      // Load the subwidget dependencies
                var widget = Y.Wegas.Widget.create(Y.clone(cfg)), a, b;

                widget.render();                                                // Render


                a = this.escape(cfg);
                b = this.escape(widget.toObject());                             // Serialize

                this.logResult(a, b);
                //Y.Assertions.areSame(a, b, "Seralized version does not match original version");

                widget.destroy();                                               // Delete
                Y.Assertions.isTrue(widget.get("destroyed"));

                Y.later(1, this, function() {
                    this.resume(function() {                                    // Resume test
                        this.nextPage();
                        //Y.Assertions.areEqual(document.getElementById("testDiv").offsetWidth, 400, "Width of the DIV should be 400.");
                    });
                });
            }, this, cfg));
        },
        log: function(a) {
            var targetEl = Y.one("body > table");
            if (targetEl) {
                targetEl.append("<tr style=\"background:gray;color:white;\">"
                    + "<td colspan=\"2\" >" + a + "</td></tr>");// Display results
            }
        },
        logResult: function(a, b) {
            function format(t) {
                return t.replace(/\n/g, "<br />").
                    replace(/\t/g, "&nbsp;&nbsp;&nbsp;")
            }
            var targetEl = Y.one("body > table");
            if (targetEl) {
                targetEl.append("<tr " + ((a !== b) ? "style=\"background:pink\"" : "style=\"background:lightgreen\"") + ">"
                    + "<td><div>" + format(a) + "</div></td>"
                    + "<td><div>" + format(b) + "</div></td></tr>");// Display results
            }
        },
        escape: function(t) {
            return Y.JSON.stringify(this.sortObject(t), null, "\t");
        },
        sortObject: function(obj) {

            if (Y.Lang.isArray(obj)) {
                var sorted_obj = [];
                Y.Array.each(obj, function(i) {
                    sorted_obj.push(this.sortObject(i));
                }, this);
                return sorted_obj;
            } else if (Y.Lang.isObject(obj)) {

                var keys = Y.Object.keys(obj),
                    sorted_obj = {};

                keys.sort();                                                        // sort keys

                Y.Array.each(keys, function(item) {                               // create new array based on Sorted Keys
                    sorted_obj[item] = this.sortObject(obj[item]);
                }, this);
                return sorted_obj;
            } else {
                return obj;
            }


        }
    }));
}, '@VERSION@', {
    requires: [
        'test', 'json', 'io-base', 'io-xdr',
        'wegas-app',
        'wegas-editable', 'wegas-widget', 'wegas-entity', 'wegas-button', ]
});

