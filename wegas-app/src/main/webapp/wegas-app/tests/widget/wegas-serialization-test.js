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
YUI.add('wegas-serialization-test', function(Y) {

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'Y.Wegas.SerializationTest',
        /*
         * Sets up data that is needed by each test.
         */
        setUp: function() {

            // Create Y.Wegas.app mock
            Y.Wegas.app = Y.Mock();
            Y.Mock.expect(Y.Wegas.app, {
                method: "after",
                args: [Y.Mock.Value.String, Y.Mock.Value.Function, Y.Mock.Value.Object]
            })

            // Create UserFacade mock
            Y.Wegas.UserFacade = Y.Mock();
            Y.Wegas.UserFacade.cache = {
                get: function() {
                    return Y.Wegas.Editable.revive({
                        "@class": "User",
                        accounts: [{
                                "@class": "JpaAccount",
                                name: "fx",
                                mail: "fx@fx.com"
                            }]
                    });
                }
            };
            Y.Mock.expect(Y.Wegas.UserFacade, {
                method: "after",
                args: [Y.Mock.Value.String, Y.Mock.Value.Object, Y.Mock.Value.Any]
            });

            // Create GameFacade mock
            Y.Wegas.GameFacade = Y.Mock();
            Y.Wegas.GameFacade.cache = {
                getCurrentPlayer: function() {
                    return null;
                },
                getCurrentTeam: function() {
                    return null;
                }
            };

            // Create VariableDescriptorFacade mock
            Y.Wegas.VariableDescriptorFacade = Y.Mock();
            Y.Wegas.VariableDescriptorFacade.cache = {
                find: function() {
                    return null;
                }
            };
            Y.Mock.expect(Y.Wegas.VariableDescriptorFacade, {
                method: "after",
                args: [Y.Mock.Value.String, Y.Mock.Value.Object, Y.Mock.Value.Any]
            });

            // Create PageFacade mock
            Y.Wegas.PageFacade = Y.Mock();
            Y.Wegas.PageFacade.cache = {
                getPage: function() {
                    return null;
                },
                after: function() {
                    return null;
                }
            };

            // Create FileFacade mock
            Y.Wegas.FileFacade = Y.Mock();
            Y.Mock.expect(Y.Wegas.FileFacade, {
                method: "get",
                args: [Y.Mock.Value.String]
            });

            //Y.io.transport({                                                  // Enable Cross-domain requests by using flash
            //    src: './io.swf'
            //});

            //Y.one("body").append("<table></table");
        },
        /**
         *
         */
        'should instantiate and serialize default widget from an io request': function() {
            this.log("Default pages");
            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-app/db/wegas-default-pages.json")
        },
        'should instantiate and serialize crimesim widgets cfg': function() {
            this.log("Crimesim pages");
            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-crimesim/db/wegas-crimesim-pages.json")
        },
        'should instantiate and serialize cep game widgets cfg': function() {
            this.log("CEP pages");
            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-cep/db/wegas-cep-pages.json")
        },
//        'should instantiate and serialize flexitests widgets cfg': function() {
//            this.log("Flexitests pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-flexitests/db/wegas-flexitests-pages.json")
//        },
//        'should instantiate and serialize proggame widgets cfg': function() {
//            this.log("Proggame pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-proggame/db/wegas-proggame-pages.json")
//        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.log("Leaderway pages");
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-leaderway/db/wegas-leaderway-pages.json")
//        },
        'should instantiate and serialize book widget from an io request': function() {
            this.log("Book pages");
            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-book/db/wegas-book-pages.json")
        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-leaderway/db/wegas-lobby-layout.json")
//        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-leaderway/db/wegas-login-layout.json")
//        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-leaderway/db/wegas-editor-layout.json")
//        },
//        'should instantiate and serialize leaderway widget from an io request': function() {
//            this.assertJsonCfg(YUI_config.groups.wegas.base + "wegas-leaderway/db/wegas-app-layout.json")
//        },
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
                        'Content-Type': 'application/json;charset=ISO-8859-1'
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
         * @param {type} cfg
         * @returns {undefined}
         */
        assertUseAndRevive: function(cfg) {
            Y.Wegas.Widget.use(cfg, Y.bind(function(cfg) {                      // Load the subwidget dependencies

                var widget = Y.Wegas.Widget.create(cfg); // Render the subwidget

                var serializedCfg = widget.toObject();                            // Serialize

                this.logResult(Y.JSON.stringify(cfg, null, "\t"), Y.JSON.stringify(serializedCfg, null, "\t"));

                // widget.destroy();                                               // Delete
                //Y.Assert.isTrue(widget.get("destroyed"));

                widget.render();

                Y.later(1, this, function() {
                    this.resume(function() {                                    // Resume test
                        this.nextPage();
                        //Y.Assert.areEqual(document.getElementById("testDiv").offsetWidth, 400, "Width of the DIV should be 400.");
                    });
                });
            }, this, cfg));
        },
        /**
         *
         */
        nextPage: function() {
            if (!this.pagesAcc || this.pagesAcc.length === 0) {
                return;
            }
            var cPage = this.pagesAcc.pop();

            Y.log("Testing page: " + Y.JSON.stringify(cPage), "log");

            this.assertUseAndRevive(cPage);
            this.wait();
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
                return t.replace(/\n/g, "<br />").replace(/\t/g, "&nbsp;&nbsp;&nbsp;")
            }
            var targetEl = Y.one("body > table");
            if (targetEl) {
                targetEl.append("<tr " + ((a !== b) ? "style=\"background:pink\"" : "") + ">"
                        + "<td><div>" + format(a) + "</div></td>"
                        + "<td><div>" + format(b) + "</div></td></tr>");// Display results
            }
        }
    }));
}, '@VERSION@', {
    requires: ['wegas-editable', 'wegas-widget', 'wegas-entity', 'test', 'json', 'io-base', 'io-xdr']
});

