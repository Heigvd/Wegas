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

        // ** Private fields ** //
        /**
         * Holds a reference to all the dataSources used.
         */
        dataSources: [],

        /**
         * @methodOf Y.Wegas.App#
         * @private
         * @name initializer
         * @description Lifecycle methods
         */
        initializer: function () {
            Y.Wegas.app = this;
            /**
             * @memberOf Y.Wegas.App#
             * @name render
             * @event
             * @description render event
             */
            this.publish("render", {});
        },

        /**
         * @methodOf Y.Wegas.App#
         * @private
         * @name destructor
         * @description destructor methods.
         */
        destructor : function () {
            var i;
            for (i = 0; i < this.dataSources.length; i = i + 1) {
                this.dataSources[i].destroy();
            }
        },

        /**
         * @methodOf Y.Wegas.App#
         * @name render
         * @description render function
         */
        render: function () {
            var exception

            Y.io.header("Accept-Language", Y.config.lang);                      // Set the language for all requests
            this.on("render", function () {
                Y.one("body").removeClass("wegas-loading-overlay");
            });

            Y.on("io:failure", function (e, response) {
                exception = response.responseText.substring(response.responseText.indexOf('"exception'), response.responseText.length);
                exception = exception.split(",");
                if (response.status == 400 && exception[0] == '"exception":"org.apache.shiro.authz.UnauthorizedException"' ||
                exception[0] == '"exception":"org.apache.shiro.authz.UnauthenticatedException"'){
//                    Y.config.win.location.href = Y.Wegas.app.get("base") + 'wegas-app/view/login.html';   //Redirect to login
                    alert("You have been logged out or does not have permissions");
                }

            }, this);

            this.initDataSources();
            this.initCSS();
        },

        // *** Private methods ** //
        /**
         * @methodOf Y.Wegas.App#
         * @private
         * @name initDataSources
         * @description initilize DataSources
         */
        initDataSources: function () {
            var k, dataSource, dataSources = this.get('dataSources');

            // @todo Shall we use browser native parser ?
            Y.JSON.useNativeParse = true;

            this.requestCounter = 0;

            for (k in dataSources) {
                if (dataSources.hasOwnProperty(k)) {
                    dataSources[k].source = this.get("base") + dataSources[k].source;
                    dataSource = new Y.Wegas.DataSource(dataSources[k]);
                    this.dataSources[k] = this[k + "Facade"] = Y.Wegas[k + "Facade"] = dataSource;
                    dataSource.once("response", this.onInitialRequest, this);
                    if (Y.Lang.isNumber(dataSource.sendInitialRequest())) {     // Send an initial request
                        this.requestCounter += 1;                               // If the request was sent, we update the counter, which is used n the onInitialRequest() callback
                    }
                }
            }

            if (this.requestCounter === 0) {                                    // If no request was sent, render directly
                this.renderUI();
            }
        },

        /**
         * @methodOf Y.Wegas.App#
         * @private
         * @name onInitialRequest
         * @param Y.Event A Yui event
         * @description Listen to the datasources initial requests and run the renderUI()
         * method when they all arrived.
         */
        onInitialRequest: function (e) {
            this.requestCounter -= 1;
            if (this.requestCounter === 0) {
                this.renderUI();
            }
        },

        /**
         * @methodOf Y.Wegas.App#
         * @private
         * @name initCSS
         * @description Inizilize CSS
         */
        initCSS: function () {
            var i, css = this.get('cssStylesheets'),
            cfg = {
                timeout : 3000,
                context: this,
                on : {
                    success : function (id, o) {
                        this._customCSSText = o.responseText;
                        this._customCSSStyleSheet = new Y.StyleSheet(o.responseText);
                        //Y.log("RAW JSON DATA: " + o.responseText);
                        //this.updateCustomCSS(o.responseText);
                        if (this._customCSSForm) {
                            this._customCSSForm.setValue(o.responseText);
                        }
                    },
                    failure : function (id, o) {
                        Y.error("initCSS(): Page CSS loading async call failed!", new Error("Loading failed"), "Y.Wegas.App");
                    }
                }
            };

            for (i = 0; i < css.length; i += 1) {
                Y.io(this.get('base') + css[i] + '?id=' + App.genId(), cfg);  // Load the page css
            }
        },

        /**
         * @methodOf Y.Wegas.App#
         * @private
         * @name renderUi
         * @description renderUI methods
         */
        renderUI: function () {
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
         * @memberOf Y.Wegas.App#
         * @name attrributes
         * @description
         * <p><strong>Method</strong></p>
         * <ul>
         *    <li>base: Base Url for app, <i>default: /Wegas/</i></li>
         *    <li>layoutSrc : xxxxxxxxxxxxxxx</li>
         *    <li>dataSources : xxxxxxxxxxxxxxx</li>
         *    <li>cssStylesheets : xxxxxxxxxxxxxxx<i>default: []</i></li>
         *    <li>currentGameModel : xxxxxxxxxxxxxxx</li>
         *    <li>currentGame : xxxxxxxxxxxxxxx</li>
         *    <li>currentTeam : xxxxxxxxxxxxxxx</li>
         *    <li>currentPlayer : xxxxxxxxxxxxxx</li>
         *    <li>currentUser : Object litteral representing current user</li>
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
            currentPlayer: {
                setter: function (val) {
                    var cPlayer = this.dataSources.Game.rest.getPlayerById(val);
                    if (cPlayer) {                                              // @fixme
                        this.set('currentTeam', cPlayer.get("teamId"));         // When current player is updated, we also update current team
                    }
                    return val;
                }
            },
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
            }
        },
        /**
         * @methodOf Y.Wegas.App
         * @static
         * @name genId
         * @return {integer} time
         * @description generate ID
         */
        genId: function () {
            var now = new Date();
            return now.getHours() + now.getMinutes() + now.getSeconds();
        },
        /**
         * @methodOf Y.Wegas.App
         * @static
         * @name htmlEntities
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
});
