/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-app", function(Y) {
    "use strict";
    var Wegas = Y.namespace("Wegas"); // Create namespace

    // detect youtube links
    var YOUTUBE_PATTERN = /^(?:https?:)?\/\/www\.youtube(?:-nocookie)?.com\/embed\/(.*)$/;
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
            this.setupSanitizer();
            /**
             * @name render after app rendering
             * @event
             */
            this.publish("render");
            /**
             * Fired just before resetting the scenario
             */
            this.publish("beforeReset");
            /**
             * @name render after render event
             * @event
             */
            this.publish("ready", {
                fireOnce: true
            });
            this.publish("newSearchVal");
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
        setupSanitizer: function() {
            var YNodeSetContent = Y.Node.prototype.setContent;
            var YNodeSetHTML = Y.Node.prototype.setHTML;
            var YNodeCreate = Y.Node.create;

            Y.Node.create = function(content) {
                var s = Y.Wegas.App.sanitize(content);
                return YNodeCreate.call(Y.Node, s);
            };
            Y.Node.prototype.setContent = function(content) {
                return YNodeSetContent.call(this, Y.Wegas.App.sanitize(content));
            };
            Y.Node.prototype.setHTML = function(html) {
                return YNodeSetHTML.call(this, Y.Wegas.App.sanitize(html));
            };
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
            var ds,
                dsClass,
                widgetCfg,
                totalRequests,
                dataSources = this.get("dataSources"), // Data sources cfg objects
                events = [],
                event,
                requestCounter = 0,
                onRequest = function() {
                    // When a response to initial requests is received
                    var playerCode, playerLanguage;
                    requestCounter -= 1;
                    Y.one(".wegas-loading-app-current")
                        .setAttribute("style",
                            "width:" + (1 - requestCounter / totalRequests) * 100 + "%");
                    if (requestCounter === 0) {
                        // If all initial request are completed,
                        while ((event = events.shift()) !== undefined) {
                            event.detach();
                        }
                        this.plug(Y.Plugin.SurveyListener);
                        this.plug(Y.Plugin.LockManager);
                        this.plug(Y.Plugin.IdleMonitor);
                        this.idlemonitor.on("idle", Y.bind(this.goIdle, this));
                        this.idlemonitor.on("resume", Y.bind(this.resume, this));
                        // various idle settings
                        //this.idlemonitor.set("timeout", 900000);  // 15 minutes
                        this.idlemonitor.set("timeout", 1800000); // 30 minutes
                        //this.idlemonitor.set("timeout", 2700000);  // 45 minutes
                        //this.idlemonitor.set("timeout", 3600000);  // 1 hour

                        this.idlemonitor.set("resolution", 60000); // check each minute
                        //this.idlemonitor.set("resolution", 300000); // check each five minutes

                        this.idlemonitor.start();
                        this.fire("preRender");
                        playerCode = Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("lang");
                        playerLanguage = I18n.findLanguageByCode(playerCode);
                        if (playerLanguage && playerLanguage.get("active")) {
                            I18n.setCode(playerCode);
                            Y.later(10, this, function() {
                                // Let the loading div update
                                this.widget = Wegas.Widget.create(widgetCfg) // Instantiate the root widget
                                    .render(); // and render it
                                this.fire("render"); // Fire a render event for some post processing
                                this.fire("ready"); // Fire a ready event for some eventual post processing
                                Y.log("Ready");
                                Y.one(".wegas-loading-app").remove();
                            });
                        } else {
                            I18n.resetPlayerCode(
                                Y.bind(function(newCode) {
                                    I18n.setCode(newCode);
                                    Y.later(10, this, function() {
                                        // Let the loading div update
                                        this.widget = Wegas.Widget.create(widgetCfg) // Instantiate the root widget
                                            .render(); // and render it
                                        this.fire("render"); // Fire a render event for some post processing
                                        this.fire("ready"); // Fire a ready event for some eventual post processing
                                        Y.log("Ready");
                                        Y.one(".wegas-loading-app").remove();
                                    });
                                }, this));
                        }
                    }
                };
            Y.io.header("Accept-Language", Y.config.lang); // Set up the language for all requests
            Y.on("io:failure", this.globalFailureHandler, this); // Set up a default failure handler

            // Send data sources initial requests
            Wegas.use(Y.Object.values(dataSources), Y.bind(function(Y) {
                // Retrieve data sources dependencies (e.g. Pusher)
                Y.Object.each(dataSources, function(cfg, name) {
                    // For each data source,
                    cfg.source = this.get("base") + (cfg.source || ""); // Set up datasource path
                    dsClass = Wegas[cfg.type] || Wegas.DataSource; // Determine which class to use (default is Y.Wegas.DataSource)
                    ds = new dsClass(cfg); // Instantiate the datasource
                    if (ds.hasInitialRequest()) {
                        // If the data source has an initial request,
                        Y.log(ds.getInitialRequestsCount());
                        requestCounter += ds.getInitialRequestsCount(); // increment request counter
                        ds.sendInitialRequest(); // send it
                        events.push(ds.on("response", onRequest, this)); // and increment the request counter
                    }
                    this.dataSources[name] = ds; // Push to data source list
                }, this);
                this.dataSources.VariableDescriptor = this.dataSources.Variable; // @backward compatibility

                requestCounter += 1;
                this.dataSources.Page.once("response", function(e) {
                    // When page data source response arrives,
                    widgetCfg = e.response.results; // store the result for later use
                    Wegas.use(widgetCfg, Y.bind(onRequest, this)); // Optim: Load pages dependencies as soon as the data is received
                }, this);
                totalRequests = requestCounter;
            }, this));
            // Post render events
            this.on("render", function() {
                // When the first page is rendered,

                var gm = Y.Wegas.Facade.Game.cache.getCurrentGame();
                var extraTabs;
                Y.Array.find(["#centerTabView", "#rightTabView"], function(item) {
                    var parent = Y.Widget.getByNode(item);
                    if (parent && parent.extratabs) {
                        extraTabs = parent.extratabs;
                        return true;
                    }
                    return false;
                }, this);
                if (extraTabs) {
                    Y.Wegas.Facade.Page.cache.getIndex(function(index) {
                        var items = [index.root];
                        while (items.length) {
                            var item = items.shift();
                            if (item["@class"] === "Folder") {
                                items = items.concat(item.items);
                            } else if (item["@class"] === "Page") {
                                var target = [];
                                if (item.trainerPage) {
                                    target.push("host");
                                }

                                if (item.scenaristPage) {
                                    target.push("edit");
                                }
                                if (target.length) {
                                    extraTabs._addTab({
                                        label: item.name,
                                        targetMode: target,
                                        children: [{
                                                type: "PageLoader",
                                                pageLoaderId: "extraTab_" + item.id,
                                                defaultPageId: item.id
                                            }
                                        ]
                                    });
                                }
                            }
                        }

                        if (gm.get("properties").get("val").logID) {
                            extraTabs._addTab({
                                label: I18n.t("global.statistics"),
                                children: [{
                                        type: "Statistics"
                                    }
                                ]
                            });
                        }

                        Y.Array.each(
                            Y.Wegas.Facade.Variable.cache.findAll("@class", "PeerReviewDescriptor"),
                            function(prd) {
                                extraTabs._addTab({
                                    label: I18n.t("global.peerReview"),
                                    children: [
                                        {
                                            type: "ReviewOrchestrator",
                                            variable: {
                                                "@class": "Script",
                                                content:
                                                    'Variable.find(gameModel, "' +
                                                    prd.get("name") +
                                                    '");\n'
                                            }
                                        }
                                    ]
                                });
                            }, this);
                        // @TODO Until all survey concepts are agreed upon,
                        // restrict the survey tab to admins or games already containing a survey:
                        var isCurrentUserAdmin = !!Y.Wegas.Facade.User.cache
                            .get("currentUser")
                            .get("roles")
                            .find(function(role) {
                                return role.get("name") === "Administrator";
                            });
                        if (isCurrentUserAdmin
                            || Y.Wegas.Facade.Variable.cache.find("@class", "SurveyDescriptor")
                            ) {
                            extraTabs._addTab({
                                label: I18n.t("global.surveys"),
                                // This widget automatically updates the server script path
                                targetMode: ["host"],
                                cssClass: "survey-orchestrator-parent",
                                children: [{
                                        type: "SurveyOrchestrator"
                                    }
                                ]
                            });
                        }
                    });
                }

                Y.one("body").on("key", function(e) {
                    // detect ctrl+§ key
                    // top left key only
                    if (e._event.code === "Backquote") {
                        if (e.ctrlKey || e.metaKey) {
                            var body = e.currentTarget;
                            if (e.altKey) {
                                body.toggleClass("wegas-internalmode");
                                //Toggle stdmode class on body (hides any wegas-advancedfeature)
                            } else {
                                body.toggleClass("wegas-advancedmode");
                            }

                            if (
                                body.hasClass("wegas-internalmode") ||
                                body.hasClass("wegas-advancedmode")
                                ) {
                                body.removeClass("wegas-stdmode");
                                Y.config.win.Y = Y; // Allow access to Y instance
                            } else {
                                body.addClass("wegas-stdmode");
                                Y.config.win.Y = undefined; // remove acces to Y instance
                            }
                        }
                    }
                }, "down:", this);
            });
        },
        resume: function() {
            if (this.dataSources.Pusher) {
                var counter = 0,
                    totalRequests = 0,
                    showLoader = false,
                    events = [],
                    tIds = {},
                    variableTreeViewNode = Y.one(".wegas-editor-variabletreeview"),
                    variableTreeView,
                    onResponse = function(response) {
                        if (tIds[response.tId]) {
                            delete tIds[response.tId];
                            counter++;
                            if (showLoader) {
                                Y.one(".wegas-loading-app-current").setAttribute(
                                    "style", "width:" + (counter / totalRequests) * 100 + "%");
                            }
                            var event;
                            if (Object.keys(tIds).length === 0) {
                                while ((event = events.shift()) !== undefined) {
                                    event.detach();
                                }
                                Y.Wegas.Facade.Page.cache.forceIndexUpdate();
                                if (showLoader) {
                                    Y.one(".wegas-loading-app").remove();
                                }

                                if (variableTreeView) {
                                    variableTreeView.set("bypassSyncEvents", false);
                                    Y.log("Enable TVsync");
                                    variableTreeView.syncUI();
                                }
                            }
                        }
                    };
                if (variableTreeViewNode) {
                    variableTreeView = Y.Widget.getByNode(variableTreeViewNode);
                    variableTreeView.set("bypassSyncEvents", true);
                    Y.log("Disable TVsync");
                }

                // not idle anylonger
                Y.one("body").toggleClass("idle", false);
                if (showLoader) {
                    // but show loader
                    Y.one("body").prepend("<div class='wegas-loading-app'><div><div class='wegas-loading-app-current'></div></div></div>");
                }
                // listen to pusher
                this.dataSources.Pusher.resume();
                // and resend initial requests
                var processedDs = {};
                for (var dsId in this.dataSources) {
                    var ds = this.dataSources[dsId];
                    // since Variable === VariableDescriptor, make sure to process db once only
                    if (!processedDs[ds._yuid]) {
                        processedDs[ds._yuid] = true;
                        if (ds.hasInitialRequest()) {
                            totalRequests += ds.getInitialRequestsCount();
                            var tId = ds.sendInitialRequest({
                                cfg: {
                                    // do not act as initial request (ie. send update events)
                                    initialRequest: false
                                }
                            });
                            // store initial request transationId
                            tIds[tId] = "pending";
                            events.push(ds.after("response", onResponse, this));
                        }
                    }
                }
            }
        },
        goIdle: function() {
            if (this.dataSources.Pusher) {
                Y.one("body").toggleClass("idle", true);
                this.dataSources.Pusher.disconnect();
            }
        },
        /**
         * Destructor methods.
         * @function
         * @public
         */
        destructor: function() {
            this.widget.destroy();
            Y.Object.each(this.dataSources, function(i) {
                i.destroy();
            });
        },
        // ** Private methods ** //
        /**
         *
         * @param {type} tId
         * @param {type} req
         * @param {type} e
         * @returns {undefined}
         */
        globalFailureHandler: function(tId, req, e) {
            // Add a global io failure listener
            var response, msg;
            try {
                msg = "Error sending " + e.cfg.method + " request : " + e.target.get("source")
                    + e.request + ", " + e.cfg.data + ": ";
            } catch (e) {
                msg = "Error sending request: ";
            }
            try {
                response = Y.JSON.parse(req.responseText);
                msg += "\n Server reply " + Y.JSON.stringify(response, null, "\t");
                if (response.exception === "org.apache.shiro.authz.UnauthenticatedException") {
                    // If the user session has timed out,
                    // Show a message that invites to reconnect
                    new Wegas.Panel({
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
            } catch (e) {
                // Error while parsing json
                msg += "\n Server reply " + (req && req.responseText);
            }
            Y.log(msg, "error", "Y.Wegas.App"); // Log the error
        }
    }, {
        /**
         * Destroy all given DOM node
         * @param {type} list DOM node list
         */
        removeTags: function(list) {
            for (var i = 0; i < list.length; i++) {
                list[i].remove();
            }
        },
        /**
         * Clean some html fragment. Remove <script> and <link> tags. Remove all onEvent attributes.
         * Sandbox all iframe (except those which embed youtube viedeo :-/). Prevent autocompletion
         * of password input
         *
         * @param {string} html html fragment to sanitize
         * @returns clean html
         */
        sanitize: function(html) {
            if (html) {
                if (typeof html === "string") {
                    var root;
                    // table element must be set in a parent of the correct type
                    if (html.startsWith("<tr")) {
                        root = document.createElement("tbody");
                    } else if (html.startsWith("<tbody")) {
                        root = document.createElement("table");
                    } else if (html.startsWith("<thead")) {
                        root = document.createElement("table");
                    } else if (html.startsWith("<th")) {
                        root = document.createElement("thead");
                    } else if (html.startsWith("<colgroup")) {
                        root = document.createElement("table");
                    } else {
                        // any other content can be set within a div
                        root = document.createElement("div");
                    }
                    root.innerHTML = html;
                    var list;
                    // remove script and link tags
                    list = root.getElementsByTagName("script");
                    Y.Wegas.App.removeTags(list);
                    list = root.getElementsByTagName("link");
                    Y.Wegas.App.removeTags(list);
                    // force iframe to be sandboxed
                    list = root.getElementsByTagName("iframe");
                    for (var i = 0; i < list.length; i++) {
                        // One shall not set allow-same-origin EVER
                        // But embedding youtube videos requires it...
                        // Youtube sucks
                        // youtube wants to track you

                        // So if the src match a youtube video,
                        // the iframe is nto secured
                        var src = list[i].getAttribute("src");
                        var fallback = true;

                        if (src) {
                            var match = src.match(YOUTUBE_PATTERN);
                            if (match) {
                                fallback = false;
                                // Youtube really sucks
                                // so we force using RGPD compliant url
                                list[i].setAttribute("src", "https://www.youtube-nocookie.com/embed/" + match[1]);
                            } else if (src.startsWith("http://")){
                                // force https
                                list[i].setAttribute("src", src.replace("http://", "https://"));
                            }
                        }

                        if (fallback) {
                            // other cases => sandbox
                            list[i].setAttribute("sandbox", "allow-scripts");
                        }
                    }

                    // prevent password auto fill by browser add-on
                    list = root.querySelectorAll("input[type='password']");
                    for (var i = 0; i < list.length; i++) {
                        list[i].setAttribute("autocomplete", "new-password");
                    }

                    // remove all onEvent attributes
                    // (no CSS way to select all node wih on* attributes, let's iterate over and over...)
                    list = root.querySelectorAll("*");
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        for (var j = 0; j < item.attributes.length; j++) {
                            var attr = item.attributes[j];
                            if (attr.name.startsWith("on")) {
                                item.setAttribute(attr.name, "");
                            }
                        }
                    }
                    return root.innerHTML;
                } else if (typeof html === "number") {
                    return html;
                } else {
                    console.error("Could not sanitize non-string argument!", html);
                }
            }
            //return html;
        },
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
