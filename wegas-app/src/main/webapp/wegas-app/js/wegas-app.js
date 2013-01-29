/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-app', function (Y) {
    "use strict";

    /**
    * @name Y.Wegas.App
    * @class  Base class for wegas, handle initialisation of datasources and rendering
    * @constructor
    * @param Object Will be used to fill attributes field
    * @description create a new wegas-app
    */
    var App = Y.Base.create("wegas-app", Y.Base, [], {

        /**
         * @lends Y.Wegas.App#
         */
        // ** Private fields ** //
        /**
         * Holds a reference to all the dataSources used.
         */
        dataSources: [],

        /**
         * @function
         * @private
         * @description Lifecycle methods
         */
        initializer: function () {
            Y.Wegas.app = this;
            /**
             * @memberOf Y.Wegas.App#
             * @event
             * @name render
             * @description render event
             */
            this.publish("render", {});
        },

        /**
         * @function
         * @private
         * @description destructor methods.
         */
        destructor : function () {
            var i;
            for (i = 0; i < this.dataSources.length; i = i + 1) {
                this.dataSources[i].destroy();
            }
        },

        /**
         * @function
         * @description render function
         */
        render: function () {
            Y.io.header("Accept-Language", Y.config.lang);                      // Set the language for all requests
            Y.JSON.useNativeParse = true;                                       // @todo Shall we use browser native parser ?

            this.on("render", function () {                                     // Remove loading overlay on render
                Y.one("body").removeClass("wegas-loading-overlay");
            });

            Y.on("io:failure", function (tId, e) {
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
        },

        // *** Private methods ** //
        /**
         * @function
         * @private
         * @description initilize DataSources
         */
        initDataSources: function () {
            var k, dataSource, dataSources = this.get('dataSources'),
            onInitialRequest = function () {
                this.requestCounter -= 1;
                if (this.requestCounter === 0) {
                    this.initPage();                                            // Run the initPage() method when they all arrived.
                }
            };

            this.requestCounter = 0;

            for (k in dataSources) {
                if (dataSources.hasOwnProperty(k)) {
                    dataSources[k].source = this.get("base") + dataSources[k].source; // Set up datasource path
                    dataSource = new Y.Wegas.DataSource(dataSources[k]);        // Instantiate the datasource
                    this.dataSources[k] = Y.Wegas[k + "Facade"] = this[k + "Facade"] = dataSource; // Set up global references
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
        initPage: function () {
            Y.io(this.get('base') + this.get('layoutSrc') + '?id=' + App.genId(), {
                context: this,
                on: {
                    success: function (id, o, args) {
                        var cfg;
                        try {
                            cfg = Y.JSON.parse(o.responseText);		// Process the JSON data returned from the server
                        } catch (e) {
                            alert("Wegas.App.initUI(): Layout json parse failed failed!");
                            Y.error("Layout parse failed", e, "Y.Wegas.App");
                            return;
                        }

                        Y.Wegas.Widget.use(cfg, Y.bind(function (cfg) {          // Load the subwidget dependencies
                            this.widget = Y.Wegas.Widget.create(cfg);           // Render the subwidget
                            this.widget.render();
                            this.fire("render");                                // Fire a render event for some eventual post processing
                        }, this, cfg));

                    //this.pageLoader = new Y.Wegas.PageLoader();               // Load the subwidget using pageloader
                    //this.pageLoader.render();
                    // cfg.id = -100;
                    // this.dataSources.Page.data.push(cfg);
                    //try {
                    //    this.pageLoader.set("pageId", -100);
                    //} catch (renderException) {
                    //    Y.log('initUI(): Error rendering UI: ' + ((renderException.stack) ? renderException.stack : renderException), 'error', 'Wegas.App');
                    //}

                    }
                }
            });
        }
    }, {
        /**
         * @lends Y.Wegas.App
         */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Method</strong></p>
         * <ul>
         *    <li>base: Base Url for app, <i>default: /</i></li>
         *    <li>layoutSrc : xxxxxxxxxxxxxxx</li>
         *    <li>dataSources : xxxxxxxxxxxxxxx</li>
         *    <li>cssStylesheets : xxxxxxxxxxxxxxx<i>default: []</i></li>
         *    <li>currentGameModel : xxxxxxxxxxxxxxx</li>
         *    <li>currentGame : xxxxxxxxxxxxxxx</li>
         *    <li>currentTeam : xxxxxxxxxxxxxxx</li>
         *    <li>currentPlayer : xxxxxxxxxxxxxx</li>
         *    <li>currentUser : Object litteral representing current user</li>
         *    <li>editorMenus :
         *        This field is used to globally override Entities edition menus.
         *        Use the target class name as the key.
         *    </li>
         *    <li>editorForms :
         *        This field is used to globally override Entities edition forms.
         *        Use the target class name as the key.
         *    </li>
         * </ul>
         */
        ATTRS: {
            /**
             * Base url for app
             */
            base: {
                getter: function () {
                    return Y.config.groups.wegas.base;
                }
            },
            layoutSrc: {},
            dataSources: {
                value: {}
            },
            cssStylesheets: {
                value: []
            },
            currentGameModel: {},
            currentGame: {},
            currentTeam: {},
            currentPlayer: {},
            /**
             * Object litteral representing current user.
             */
            currentUser: { },
            /**
             *
             */
            devMode: {
                value: false,
                setter: function (val) {
                    if (val) {
                        Y.one("body").addClass("wegas-devmode");
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
        },
        /**
         * @function
         * @static
         * @return {integer} time
         * @description generate ID
         */
        genId: function () {
            var now = new Date();
            return now.getHours() + now.getMinutes() + now.getSeconds();
        },
        /**
         * @function
         * @static
         * @param str String
         * @return {String} Escaped string
         * @description Escape all necessary character
         */
        htmlEntities: function (str) {
            return String(str).replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        },
        nl2br: function (str, is_xhtml) {
            var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
            return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
        }
    });

    Y.namespace('Wegas').App = App;

    /**
     * Shortcut to activate developper mode
     */
    Y.devMode = function () {
        Y.Wegas.app.set("devMode", true);
    };
});
