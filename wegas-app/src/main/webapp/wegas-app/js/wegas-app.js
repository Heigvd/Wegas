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
     *    <li>editorMenus {Object[]}
     *        This field is used to globally override Entities edition menus.
     *        Use the target class name as the key.
     *    </li>
     *    <li>editorForms {Object[]}
     *         This field is used to globally override Entities edition forms.
     *        Use the target class name as the key.
     *   </li>
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
            this.publish("render", {});
        },

        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.dataSources.length; i = i + 1) {
                this.dataSources[i].destroy();
            }
        },

        /**
         * Render function
         * @function
         * @private
         */
        render: function() {
            Y.io.header("Accept-Language", Y.config.lang);                      // Set the language for all requests
            Y.JSON.useNativeParse = true;                                       // @todo Shall we use browser native parser ?

            this.on("render", function() {                                     // Remove loading overlay on render
                Y.one("body").removeClass("wegas-loading-overlay");
            });

            Y.on("io:failure", function(tId, e) {
                if (!e) {
                    return;
                }
                var exception = e.responseText.substring(e.responseText.indexOf('"exception'), e.responseText.length);
                exception = exception.split(",");
                if (e.status === 400 && exception[0] === '"exception":"org.apache.shiro.authz.UnauthorizedException"' ||
                    exception[0] === '"exception":"org.apache.shiro.authz.UnauthenticatedException"') {
                    // Y.config.win.location.href = Y.Wegas.app.get("base") + 'wegas-app/view/login.html';   //Redirect to login
                    alert("You have been logged out or does not have permissions");
                }
            }, this);

            this.initDataSources();

            /**
             * Shortcut to activate developper mode. Allow access to Y instance. Toggle.
             * Event keypress '°'
             */
            Y.one("body").on("keypress", function(e) {
                if (e.charCode === 176 && e.target === this) {
                    Y.Wegas.app.set("devMode", !Y.Wegas.app.get("devMode"));
                }
            });
        },

        // *** Private methods ** //
        /**
         * @function
         * @private
         * @description initilize DataSources
         */
        initDataSources: function() {
            var k, dataSource, dataSources = this.get('dataSources'),
            onInitialRequest = function() {
                this.requestCounter -= 1;
                if (this.requestCounter === 0) {
                    this.initPage();                                       // Run the initPage() method when they all arrived.
                }
            };

            this.requestCounter = 0;

            for (k in dataSources) {
                if (dataSources.hasOwnProperty(k)) {
                    dataSources[k].source = this.get("base") + dataSources[k].source; // Set up datasource path
                    dataSource = new Y.Wegas.DataSource(dataSources[k]);        // Instantiate the datasource
                    Y.namespace("Wegas.Facade")[k] = dataSource;                 // Set up global references
                    dataSource.once("response", onInitialRequest, this);        // Listen to the datasources initial requests
                    if (Y.Lang.isNumber(dataSource.sendInitialRequest())) {     // Send the initial request
                        this.requestCounter += 1;                               // If the request was sent, update the counter
                    }
                }
            }

            if (this.requestCounter === 0) {                                    // If no request was sent, render directly
                this.initPage();
            }
        },

        /**
         * @function
         * @private
         * @description initPage methods
         */
        initPage: function() {
            Y.io(this.get('base') + this.get('layoutSrc') + '?id=' + Y.Wegas.Helper.genId(), {
                context: this,
                on: {
                    success: function(id, o) {
                        var cfg;
                        try {
                            cfg = Y.JSON.parse(o.responseText);		// Process the JSON data returned from the server
                        } catch (e) {
                            alert("Wegas.App.initUI(): Layout json parse failed failed!");
                            Y.error("Layout parse failed", e, "Y.Wegas.App");
                            return;
                        }

                        Y.Wegas.Widget.use(cfg, Y.bind(function(cfg) {         // Load the subwidget dependencies
                            this.widget = Y.Wegas.Widget.create(cfg);           // Render the subwidget
                            this.widget.render();
                            this.fire("render");                         // Fire a render event for some eventual post processing
                        }, this, cfg));

                    //this.pageLoader = new Y.Wegas.PageLoader();               // Load the subwidget using pageloader
                    //this.pageLoader.render();
                    // cfg.id = -100;
                    // this.dataSources.Page.data.push(cfg);
                    //try {
                    //    this.pageLoader.set("pageId", -100);
                    //} catch (renderException) {
                    //    Y.log('initUI(): Error rendering UI: ' + ((renderException.stack)
                    //     ? renderException.stack : renderException), 'error', 'Wegas.App');
                    //}

                    }
                }
            });
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
                    return Y.config.groups.wegas.base;
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
            /**
             * Object litteral representing current user.
             */
            currentUser: {},
            /**
             *
             */
            devMode: {
                value: false,
                setter: function(val) {
                    if (val) {
                        Y.one("body").addClass("wegas-devmode");
                        //if (YUI_config.debug) {
                        window.Y = Y;
                    //}
                    } else {
                        Y.one("body").removeClass("wegas-devmode");
                        // if (YUI_config.debug) {
                        delete window.Y;
                    //}
                    }
                }
            },
            /**
             * This field is used to globally override Entities edition menus.
             * Use the target class name as the key.
             */
            editorMenus: {
                value: {}
            },
            /**
             * This field is used to globally override Entities edition forms.
             * Use the target class name as the key.
             */
            editorForms: {
                value: {}
            }
        }

    });
    Y.namespace('Wegas').App = App;
});
