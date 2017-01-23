/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-app', function(Y) {
    "use strict";

    var Wegas = Y.namespace('Wegas'); // Create namespace

    /**
     * Create a new wegas-app
     *
     * <p><strong>Attributes</strong></p>
     * <ul>
     *    <li>base {String} base url for app</li>
     *    <li>dataSources {Object[]} the list of datasource to be loaded on startup</li>
     * </ul>
     *
     * @name Y.Wegas.App
     * @class Base class for wegas, handle initialisation of datasources and rendering
     * @extends Y.Base
     * @constructor
     * @param Object Will be used to fill attributes field
     */
    Wegas.App = Y.Base.create("wegas-app", Y.Base, [], {
        /** @lends Y.Wegas.App# */
        // ** Public methods ** //
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            /**
             * @name render
             * @event
             */
            this.publish("render");
            /**
             * @name render
             * private
             */
            this.dataSources = {};

            this._pendingRequests = 0;
            window.onbeforeunload = function() {
                Y.log("PENDINGS: " + Y.Wegas.app._pendingRequests);
                if (Y.Wegas.app._pendingRequests > 0) {
                    return "Some requests are still pending ! Please stay on the page to avoid losing part of your work";
                } else {
                    return;
                }
            };

            Wegas.app = this; // Setup global references to the app
            Wegas.Facade = this.dataSources; // and the data sources
        },
        preSendRequest: function() {
            this._pendingRequests += 1;
            Y.log("Pre: " + this._pendingRequests);
        },
        postSendRequest: function() {
            this._pendingRequests -= 1;
            Y.log("Post: " + this._pendingRequests);
        },
        /**
         * Render function
         * @function
         * @public
         */
        render: function() {
            var ds, dsClass, widgetCfg, totalRequests,
                dataSources = this.get('dataSources'), // Data sources cfg objects
                events = [], event,
                requestCounter = 0, //                                          // Request counter 
                onRequest = function() { // When a response to initial requests is received
                    requestCounter -= 1;
                    Y.one(".wegas-loading-app-current").setAttribute("style", "width:" + ((1 - requestCounter / totalRequests) * 100) + "%");

                    if (requestCounter === 0) { // If all initial request are completed,
                        while ((event = events.shift()) !== undefined) {
                            event.detach();
                        }
                        this.plug(Y.Plugin.LockManager);
                        this.fire("preRender");
                        Y.later(10, this, function() { // Let the loading div update
                            this.widget = Wegas.Widget.create(widgetCfg) // Instantiate the root widget
                                .render(); // and render it
                            this.fire("render"); // Fire a render event for some eventual post processing
                            Y.one(".wegas-loading-app").remove();
                        });
                    }
                };

            Y.io.header("Accept-Language", Y.config.lang); // Set up the language for all requests
            Y.on("io:failure", this.globalFailureHandler, this); // Set up a default failure handler

            // Send data sources initial requests
            Wegas.use(Y.Object.values(dataSources), Y.bind(function(Y) { // Retrieve data sources dependencies (e.g. Pusher)
                Y.Object.each(dataSources, function(cfg, name) { // For each data source,       
                    cfg.source = this.get("base") + (cfg.source || ""); // Set up datasource path
                    dsClass = Wegas[cfg.type] || Wegas.DataSource; // Determine which class to use (default is Y.Wegas.DataSource)
                    ds = new dsClass(cfg); // Instantiate the datasource
                    if (ds.hasInitialRequest()) { // If the data source has an initial request,
                        Y.log(ds.getInitialRequestsCount());
                        requestCounter += ds.getInitialRequestsCount(); // increment request counter
                        ds.sendInitialRequest(); // send it
                        events.push(ds.on("response", onRequest, this)); // and increment the request counter
                    }
                    this.dataSources[name] = ds; // Push to data source list
                }, this);

                this.dataSources.VariableDescriptor = this.dataSources.Variable; // @backward compatibility

                requestCounter += 1;
                this.dataSources.Page.once("response", function(e) { // When page data source response arrives,
                    widgetCfg = e.response.results; // store the result for later use
                    Wegas.use(widgetCfg, Y.bind(onRequest, this)); // Optim: Load pages dependencies as soon as the data is received
                }, this);
                totalRequests = requestCounter;
            }, this));

            // Post render events
            this.on("render", function() { // When the first page is rendered,
                Y.one("body").on("key", function(e) { // Add shortcut to activate developper mode on key '§' pressed
                    e.currentTarget.toggleClass("wegas-stdmode") // Toggle stdmode class on body (hides any wegas-advancedfeature)
                        .toggleClass("wegas-advancedmode");
                    Y.config.win.Y = Y; // Allow access to Y instance
                }, "167", this);
            });
        },
        /**
         * Destructor methods.
         * @function
         * @public
         */
        destructor: function() {
            Y.Object.each(this.dataSources, function(i) {
                i.destroy();
            });
            this.widget.destroy();
        },
        // ** Private methods ** //
        /**
         * 
         * @param {type} tId
         * @param {type} req
         * @param {type} e
         * @returns {undefined}
         */
        globalFailureHandler: function(tId, req, e) { // Add a global io failure listener
            var response, msg;
            try {
                msg = "Error sending " + e.cfg.method + " request : " + e.target.get("source") + e.request
                    + ", " + e.cfg.data + ": ";
            } catch (e) {
                msg = "Error sending request: ";
            }
            try {
                response = Y.JSON.parse(req.responseText);
                msg += "\n Server reply " + Y.JSON.stringify(response, null, "\t");

                if (response.exception === "org.apache.shiro.authz.UnauthenticatedException") { // If the user session has timed out,
                    new Wegas.Panel({//                                         // Show a message that invites to reconnect
                        content: "<div class='icon icon-info'>You have been logged out.</div>",
                        modal: true,
                        buttons: {
                            footer: [{
                                    label: 'Click here to reconnect',
                                    action: function() {
                                        Y.config.win.location.reload();
                                    }
                                }]
                        }
                    }).render();
                    e.halt(true);
                } //else if (r.exception === "org.apache.shiro.authz.UnauthorizedException") {
                // @todo Do something?
                //}
            } catch (e) { // Error while parsing json
                msg += "\n Server reply " + (req && req.responseText);
            }
            Y.log(msg, "error", "Y.Wegas.App"); // Log the error
        }
    }, {
        /** @lends Y.Wegas.App */
        /**
         * @field
         * @static
         */
        ATTRS: {
            dataSources: {
                value: {}
            },
            /**
             * Base url for app
             */
            base: {
                getter: function() {
                    return Y.config.groups.wegas.base.replace("wegas-app/", "");
                }
            }
        }
    });
});
