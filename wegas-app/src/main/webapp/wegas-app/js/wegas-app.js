/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-app', function(Y) {
    "use strict";

    /**
     * Create a new wegas-app
     *
     * <p><strong>Attributes</strong></p>
     * <ul>
     *    <li>base {String} base Url for app</li>
     *    <li>layoutSrc {String} location for the json config of the current page</li>
     *    <li>dataSources {Object[]} the list of datasource to be loaded on startup</li>
     *    <li>currentGameModel {Number} current game model id</li>
     *    <li>currentGame {Number} current game  id</li>
     *    <li>currentTeam {Number} current team id</li>
     *    <li>currentPlayer {Number} current player id</li>
     *    <li>currentUse {Number} current game model idObject litteral representing current user</li>
     * </ul>
     *
     * @name Y.Wegas.App
     * @class Base class for wegas, handle initialisation of datasources and rendering
     * @extends Y.Base
     * @constructor
     * @param Object Will be used to fill attributes field
     */
    var App = Y.Base.create("wegas-app", Y.Base, [], {
        /** @lends Y.Wegas.App# */

        // ** Private fields ** //
        /**
         * Holds a reference to all the dataSources used.
         * @field
         * @private
         */
        dataSources: [],
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            Y.Wegas.app = this;
            /**
             * @name Cocktail#shake
             * @event
             * @param {MyEventObject} e
             * @param {Boolean} [e.withIce=false]
             */
            this.publish("render");
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            Y.Object.each(Y.Wegas.Facade, function(i) {
                i.destroy();
            });
        },
        /**
         * Render function
         * @function
         * @private
         */
        render: function() {
            Y.io.header("Accept-Language", Y.config.lang);                      // Set the language for all requests
            Y.JSON.useNativeParse = true;                                       // @todo Shall we use browser native parser ?

            this.on("render", function() {                                      // Remove loading overlay on render
                Y.one("body").removeClass("wegas-loading-overlay");
                /**
                 * Shortcut to activate developper mode. Allow access to Y instance. Toggle.
                 * Event keypress '°'
                 */
                Y.one("body").on("key", function() {
                    Y.Wegas.app.set("devMode", !Y.Wegas.app.get("devMode"));
                }, "167");
            });

            Y.on("io:failure", this.globalFailureHandler, this);

            this.initDataSources();
        },
        // *** Private methods ** //
        /**
         * @function
         * @private
         * @description initilize DataSources
         */
        initDataSources: function() {
            var onInitialRequest = function() {
                this.requestCounter -= 1;
                if (this.requestCounter === 0) {
                    this.initPage();                                            // Run the initPage() method when they all arrived.
                }
            };

            this.requestCounter = 1;

            Y.io(this.get('base') + this.get('layoutSrc') + '?id=' + Y.Wegas.Helper.genId(), {// No cache
                context: this,
                on: {
                    success: function(id, o) {
                        try {
                            this.widgetCfg = Y.JSON.parse(o.responseText);      // Process the JSON data returned from the server
                        } catch (e) {
                            alert("Wegas.App.initUI(): Layout json parse failed failed!");
                            Y.error("Layout parse failed", e, "Y.Wegas.App");
                            return;
                        }

                        Y.Wegas.use(this.widgetCfg, Y.bind(onInitialRequest, this));// Load the subwidget dependencies
                    }
                }
            });

            Y.Wegas.use(Y.Object.values(this.get('dataSources')), Y.bind(function(Y) {
                var k, dataSource, dataSources = this.get('dataSources');

                for (k in dataSources) {
                    if (dataSources.hasOwnProperty(k)) {
                        dataSources[k].source
                                = this.get("base") + dataSources[k].source;     // Set up datasource path
                        dataSource = dataSources[k]["type"] ?
                                new Y.Wegas[dataSources[k]["type"]](dataSources[k])
                                : new Y.Wegas.DataSource(dataSources[k]);       // Instantiate the datasource
                        Y.namespace("Wegas.Facade")[k] = dataSource;            // Set up global references
                        dataSource.once("response", onInitialRequest, this);    // Listen to the datasources initial requests
                        if (Y.Lang.isNumber(dataSource.sendInitialRequest())) { // Send the initial request
                            this.requestCounter += 1;                           // If the request was sent, update the counter
                        }
                    }
                }
            }, this));
        },
        /**
         * @function
         * @private
         * @description initPage methods
         */
        initPage: function() {
            this.widget = Y.Wegas.Widget.create(this.widgetCfg);                // Render the subwidget
            this.widget.render();
            this.fire("render");                                                // Fire a render event for some eventual post processing

            //this.pageLoader = new Y.Wegas.PageLoader();                       // Load the subwidget using pageloader
            //this.pageLoader.render();
            // cfg.id = -100;
            // this.dataSources.Page.data.push(cfg);
            //try {
            //    this.pageLoader.set("pageId", -100);
            //} catch (renderException) {
            //    Y.log('initUI(): Error rendering UI: ' + ((renderException.stack)
            //     ? renderException.stack : renderException), 'error', 'Wegas.App');
            //}
        },
        globalFailureHandler: function(tId, req, e) {                          // Add a global io failure listener
            var msg;
            try {
                msg = "Error sending " + e.cfg.method + " request : " + e.target.get("source") + e.request
                        + ", " + e.cfg.data + ": ";
            } catch (e) {
                msg = "Error sending request: ";
            }
            try {
                var r = Y.JSON.parse(req.responseText);
                msg += "\n Server reply " + Y.JSON.stringify(r, null, "\t");

                if (r.exception === "org.apache.shiro.authz.UnauthenticatedException") {
                    //Y.io(this.get("base") + "/User/LoggedIn");
                    var panel = new Y.Wegas.Panel({
                        content: "<div class='icon icon-info'>You have been logged out.</div>",
                        modal: true,
                        centered: true,
                        buttons: {
                            footer: [{
                                    label: 'Click here to reconnect',
                                    action: function() {
                                        Y.config.win.location.reload();
                                        //Y.config.win.location.href = Y.config.win.location.href + "#";
                                    }
                                }]
                        }
                    });
                    panel.render();
                    e.preventDefault();
                    return;
                } else if (r.exception === "org.apache.shiro.authz.UnauthorizedException") {
                    // @todo Do something?
                }
            } catch (e) {                                                   // JSON PARSE ERROR
                msg += "\n Server reply " + (req && req.responseText);
            }
            Y.log(msg, "error");
            if (window.Muscula) {                                           // Send an event to muscula
                window.Muscula.errors.push(new Error(msg));
            }
        }
    }, {
        /** @lends Y.Wegas.App */

        /**
         * @field
         * @static
         */
        ATTRS: {
            /**
             * Base url for app
             */
            base: {
                getter: function() {
                    return Y.config.groups.wegas.base.replace("wegas-app/", "");
                }
            },
            layoutSrc: {},
            dataSources: {
                value: {}
            },
            currentGameModel: {},
            currentGame: {},
            currentTeam: {},
            currentPlayer: {},
            currentUser: {},
            /**
             *
             */
            devMode: {
                value: false,
                setter: function(val) {
                    if (val) {
                        Y.one("body").addClass("wegas-devmode").removeClass("wegas-stdmode");
                        //if (YUI_config.debug) {
                        window.Y = Y;
                        //}
                    } else {
                        Y.one("body").removeClass("wegas-devmode").addClass("wegas-stdmode");
                        // if (YUI_config.debug) {
                        delete window.Y;
                        //}
                    }
                }
            }
        }

    });
    Y.namespace('Wegas').App = App;
});
