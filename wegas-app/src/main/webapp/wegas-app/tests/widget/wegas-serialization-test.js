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

            // Create Y.Wegas.app mock
            Wegas.app = Mock();
            Mock.expect(Wegas.app, {
                method: "after",
                args: [Mock.Value.String, Mock.Value.Function, Mock.Value.Object]
            });
            Wegas.app.get = function(name) {
                switch (name) {
                    case "base":
                        return YUI_config.groups.wegas.base + "../";
                }
            };

            // Create UserFacade mock
            Y.namespace("Wegas.Facade").User = Mock();
            Wegas.Facade.User.cache = {
                get: function() {
                    return Wegas.Editable.revive({
                        "@class": "User",
                        accounts: [{
                                "@class": "JpaAccount",
                                name: "fx",
                                mail: "fx@fx.com"
                            }]
                    });
                }
            };
            Mock.expect(Wegas.Facade.User, {
                method: "after",
                args: [Mock.Value.String, Mock.Value.Object, Mock.Value.Any],
                run: function() {                                               // Return a fake handler
                    return {
                        detach: function() {
                        }
                    }
                }
            });

            // Create GameFacade mock
            Wegas.Facade.Game = Mock();
            Wegas.Facade.Game.cache = {
                getCurrentPlayer: function() {
                    return null;
                },
                getCurrentTeam: function() {
                    return null;
                }
            };

            // Create GameModel Facade mock
            Wegas.Facade.GameModel = Mock();
            Wegas.Facade.GameModel.cache = {
                getCurrentGameModel: function() {
                    return null;
                }
            };

            // Create VariableDescriptorFacade mock
            Wegas.Facade.Variable = Mock();
            Wegas.Facade.Variable.cache = Mock();
            Mock.expect(Y.Wegas.Facade.Variable.cache, {
                method: "find",
                args: [Mock.Value.String, Mock.Value.Any],
                run: function() {                                               // Return a fake handler
                    return null;
                }
            });
            Mock.expect(Y.Wegas.Facade.Variable.cache, {
                method: "findById",
                args: [Mock.Value.Any],
                run: function() {                                               // Return a fake handler
                    return null;
                }
            });
            Y.Wegas.Facade.Variable.script = Mock();
            Mock.expect(Y.Wegas.Facade.Variable.script, {
                method: "eval",
                args: [Mock.Value.String],
                run: function() {                                               // Return a fake handler
                    return null;
                }
            });
            Mock.expect(Y.Wegas.Facade.Variable.script, {
                method: "localEval",
                args: [Mock.Value.String],
                run: function() {                                               // Return a fake handler
                    return null;
                }
            });

            Y.Wegas.Facade.Variable.after = function() {
                return new Y.Event.Handle();
            };
            Y.Wegas.Facade.Variable.sendRequest = function() {
            };
//            Mock.expect(Y.Wegas.Facade.Variable, {
//                method: "sendRequest",
//                //args: [Mock.Value.String, Mock.Value.Object, Mock.Value.Any]
//            });

            // Create PageFacade mock
            Y.Wegas.Facade.Page = Mock();
            Y.Wegas.Facade.Page.cache = {
                getPage: function() {
                    return null;
                },
                after: function() {
                    return null;
                }
            };

            // Create FileFacade mock
            Y.Wegas.Facade.File = Mock();
            Mock.expect(Y.Wegas.Facade.File, {
                method: "get",
                args: [Mock.Value.String]
            });
        },
        /**
         *
         */
        'should instantiate and serialize crimesim widgets cfg': function() {
            this.log("Crimesim pages");
            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-private/wegas-crimesim/db/wegas-crimesim-pages.json");
        },
        'should instantiate and serialize cep game widgets cfg': function() {
            this.log("CEP pages");
            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-private/wegas-cep/db/wegas-cep-pages.json");
        },
        'should instantiate and serialize proggame widgets cfg': function() {
//            this.log("Proggame pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-proggame/db/wegas-proggame-pages.json");
        },
        'should instantiate and serialize flexitests widgets cfg': function() {
//            this.log("Flexitests pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-flexitests/db/wegas-flexitests-pages.json");
        },
//        'should instantiate and serialize PMG widgets cfg': function() {
//            this.log("PMG pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-pmg/db/wegas-pmg-pages.json");
//        },
        'should instantiate and serialize leaderway widget cfgt': function() {
//            this.log("Leaderway pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-leaderway/db/wegas-leaderway-pages.json")
        },
//        'should instantiate and serialize book widget from an io request': function() {
//            this.log("Book pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-games/wegas-book/db/wegas-book-pages.json")
//        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-app/db/wegas-lobby-layout.json")
//        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-app/db/wegas-login-layout.json")
//        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "../wegas-app/db/wegas-editor-layout.json")
//        },
        //'should instantiate and serialize leaderway widget from an io request': function() {
        //this.log("Player page");
        //this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-app/db/wegas-app-layout.json")
        //},
        /**
         *
         */
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
                //Y.Assert.areSame(a, b, "Seralized version does not match original version");

                widget.destroy();                                               // Delete
                Y.Assert.isTrue(widget.get("destroyed"));

                Y.later(1, this, function() {
                    this.resume(function() {                                    // Resume test
                        this.nextPage();
                        //Y.Assert.areEqual(document.getElementById("testDiv").offsetWidth, 400, "Width of the DIV should be 400.");
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

