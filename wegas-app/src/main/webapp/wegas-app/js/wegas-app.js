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

    var Wegas = Y.namespace('Wegas'), Facade = Y.namespace("Wegas.Facade"), App;
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
    App = Y.Base.create("wegas-app", Y.Base, [], {
        /** @lends Y.Wegas.App# */

        // ** Private methods ** //
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            Wegas.app = this;                                                   // Setup a global reference to the singleton
            /**
             * Holds a reference to all the dataSources used.
             * @name dataSources
             * @field
             * @private
             */
            this.dataSources = [];
            /**
             * @name render
             * @event
             */
            this.publish("render");
        },
        /**
         * Render function
         * @function
         * public
         */
        render: function() {
            var dataSource, dataSourceClass,
                    dataSources = this.get('dataSources'),
                    onRequest = function() {                                    // When a response to initial requests is receivedd
                        this.requestCounter -= 1;
                        if (this.requestCounter === 0) {                        // If all initial request arrived,
                            this.renderPage();                                  // run the renderPage()
                        }
                    };

            Y.JSON.useNativeParse = true;                                       // @todo Shall we use browser native parser ?
            Y.io.header("Accept-Language", Y.config.lang);                      // Set up the language for all requests
            Y.on("io:failure", this.globalFailureHandler, this);                // Set up a default failure handler

            this.requestCounter = 1;                                            // Request counter (starts at 1 beceause of page request, render starts when it reaches 0)

            Y.Wegas.use(Y.Object.values(dataSources), Y.bind(function(Y) {      // Retrieve data sources dependencies
                Y.Object.each(dataSources, function(cfg, name) {                // For each data source,       
                    cfg.source = this.get("base") + cfg.source;                 // Set up datasource path
                    dataSourceClass = Y.Wegas[cfg.type] || Y.Wegas.DataSource;  // Determine which class to use (default is Y.Wegas.DataSource)
                    dataSource = new dataSourceClass(cfg);                      // Instantiate the datasource
                    Wegas.Facade[name] = dataSource;                            // Set up global references
                    dataSource.once("response", onRequest, this);               // Listen to the datasources initial requests
                    if (Y.Lang.isNumber(dataSource.sendInitialRequest())) {     // Send the initial request
                        this.requestCounter += 1;                               // If the request was sent, update the counter
                    }
                }, this);
            }, this));

            Y.io(this.get('base') + this.get('layoutSrc') + '?id=' + Y.Wegas.Helper.genId(), {// Retrieve current page json (without cache)
                context: this,
                on: {
                    success: function(id, o) {
                        try {
                            this.widgetCfg = Y.JSON.parse(o.responseText);      // Parse the JSON data returned from the server
                        } catch (e) {
                            Y.error("Layout parse failed", e, "Y.Wegas.App");
                            return;
                        }
                        Y.Wegas.use(this.widgetCfg, Y.bind(onRequest, this));   // Load the subwidget dependencies
                    }
                }
            });

            this.on("render", function() {                                      // When the first page is rendered,
                Y.one("body").removeClass("wegas-loading-overlay");             // Remove loading overlay on render
                Y.one("body").on("key", function() {                            // Shortcut to activate developper mode. Allow access to Y instance. Toggle.
                    Wegas.app.set("devMode", !Wegas.app.get("devMode"));
                }, "167");                                                      // Event keypress '°'
            });
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            Y.Object.each(Facade, function(i) {
                i.destroy();
            });
        },
        /**
         * @function
         * @private
         * @description renderPage methods
         */
        renderPage: function() {
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
        globalFailureHandler: function(tId, req, e) {                           // Add a global io failure listener
            var response, msg;
            try {
                msg = "Error sending " + e.cfg.method + " request : " + e.target.get("source") + e.request
                        + ", " + e.cfg.data + ": ";
            } catch (e) {
                msg = "Error sending request: ";
            }
            try {
                response = Y.JSON.parse(req.responseText);
                msg += "\n Server reply " + Y.JSON.stringify(r, null, "\t");

                if (response.exception === "org.apache.shiro.authz.UnauthenticatedException") {// If the user session has timed out,
                    new Y.Wegas.Panel({//                                       // show a message that invites to reconnect
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
                    }).render();
                    e.preventDefault();
                } //else if (r.exception === "org.apache.shiro.authz.UnauthorizedException") {
                // @todo Do something?
                //}
            } catch (e) {                                                       // Error while parsing json
                msg += "\n Server reply " + (req && req.responseText);
            }
            Y.log(msg, "error", "Y.Wegas.App");                                 // Log the error
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
                    Y.one("body").addClass("wegas-devmode").toggleClass("wegas-stdmode", val);
                    Y.config.win.Y = Y;                                         // Set up a reference to Y for use in the console
                }
            }
        }
    });
    Y.namespace('Wegas').App = App;
});
