/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-app', function (Y) {
    "use strict";

    var	App = Y.Base.create("wegas-app", Y.Base, [ ], {


        // ** Private fields ** //
        dataSources: [],
        _rootWidgetCfg: null,
        _rootWidget: null,

        // ** Lifecycle methods ** //
        initializer: function () {
            Y.Wegas.app = this;

            this.initDataSources();
            this.initUI();
            this.initCSS();
        },
        destructor : function () {
            // @todo Delete datasources
        },
        render: function () {
            this.requestDataSources();
        },

        // *** Private methods ** //
        initDataSources: function () {
            var dataSources = this.get('dataSources'),
                k;

            // @todo Shall we use browser native parser ?
            // Y.JSON.useNativeParse = true;
            for (k in dataSources) {
                if (dataSources.hasOwnProperty(k)) {
                    dataSources[k].source = this.get("base") + dataSources[k].source;
                    this.dataSources[k] = new Y.DataSource.IO(dataSources[k]);
                }
            }
        },
        initCSS: function () {
            var css = this.get('cssStylesheets'),
                i,
                callback = {
                    timeout : 3000,
                    context: this,
                    on : {
                        success : function (x, o) {
                            this._customCSSText = o.responseText;
                            this._customCSSStyleSheet = new Y.StyleSheet(o.responseText);
                            //Y.log("RAW JSON DATA: " + o.responseText);
                            //this.updateCustomCSS(o.responseText);
                            if (this._customCSSForm) {
                                this._customCSSForm.inputs[0].setValue(o.responseText);
                            }
                        },
                        failure : function (x, o) {
                            Y.log("initCSS(): Page CSS loading async call failed!", 'error', 'Wegas.App');
                        }
                    }
                };

            for (i = 0; i < css.length; i += 1) {
                Y.io(this.get('base') + css[i] + '?id=' + App.genId(), callback);   // Load the page css
            }
        },
        requestDataSources: function () {
            var k;
            for (k in this.dataSources) {
                if (this.dataSources.hasOwnProperty(k) && k !== "File") {
                    if (this.dataSources[k].rest) {
                        this.dataSources[k].rest.sendRequest({request: ""});
                    } else {
                        this.dataSources[k].sendRequest({request: ""});
                    }
                }
            }

        /*this.dataSources.Game.after("response", function() {
                Y.log("info", "Game has been modified, reloading variable descriptors", "Wegas.Editor");
            });*/
        },

        initUI: function() {
            Y.io(this.get('base') + this.get('layoutSrc') + '?id=' + App.genId(), {
                context: this,
                on: {
                    success: function (id, o, args) {
                        //Y.log("RedCMS.onWidgetReloadContentReceived():"+  o.responseText, 'log');
                        try {
                            this._rootWidgetCfg = Y.JSON.parse(o.responseText);				// Process the JSON data returned from the server
                        } catch (jsonException) {
                            alert("Wegas.App.initUI(): JSON Parse failed!");
                            return;
                        }
                        this._rootWidget = Y.Wegas.Widget.create(this._rootWidgetCfg);

                        try {
                            this._rootWidget.render();
                        } catch (renderException) {
                            Y.log('initUI(): Error rendering UI: ' + ((renderException.stack) ? renderException.stack : renderException), 'error', 'Wegas.App');
                        }
                    }
                }
            });
        }
    }, {
        ATTRS: {
            /**
             * Base url for app
             */
            base: { },
            layoutSrc: {},
            dataSources: {
                value: {}
            },
            forms: {
                value: []
            },
            cssStylesheets: {
                value: []
            },
            currentGameModel: {},
            currentGame: {},
            currentTeam: { },
            currentPlayer: {
                setter: function (val) {
                    var cPlayer = this.dataSources.Game.rest.getPlayerById(val);
                    if (cPlayer) { this.set('currentTeam', cPlayer.teamId); }   // When current player is updated, we also update current team
                    return val;
                }
            }
        },
        genId: function () {
            var now = new Date();
            return now.getHours() + now.getMinutes() + now.getSeconds();
        }
    });

    Y.namespace('Wegas').App = App;
});
