/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-loginbutton", function(Y) {
    "use strict";

    var Wegas = Y.Wegas, Helper = Y.Wegas.Helper,
        UserLoginButton, LoginButton, RestartButton;

    /**
     * @name Y.Wegas.LoginButton
     * @extends Y.Wegas.Button
     * @class  Button with a defined behavior.
     * @constructor
     * @description Button with special label and menu with two
     * options : set user preferences or logout
     */
    LoginButton = Y.Base.create("wegas-login", Wegas.Button, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.LoginButton# */
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description bind function to events.
         * Call widget parent to execute its proper bind function.
         * When UserFacade is updated, do syncUI
         * Add plugin menu with 2 options : open page "user preferences" and logout
         */
        bindUI: function() {
            this.handlers = {};
            this.handlers.userUpdate = Wegas.Facade.User.after("update", this.syncUI, this);
            if (Wegas.Facade.Variable)
                this.handlers.variableUpdate = Wegas.Facade.Variable.after("update", this.syncUI, this);

            if (!this.menu) { // Don't add the plugin if it already exist.
                this.plug(Y.Plugin.WidgetMenu);
            }

            var languages = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("activeLanguages");

            if (languages.length > 1) {
                this.menu.add([{
                        type: "Button",
                        label: I18n.t('i18n.languages'),
                        plugins: [{
                                fn: "WidgetMenu",
                                cfg: {
                                    event: "mouseenter",
                                    menuCfg: {
                                        points: ["tr", "tl"]
                                    },
                                    children:
                                        languages.map(function(item) {
                                            return {
                                                label: (I18n.getCode() === item.get("code")
                                                    .toUpperCase() ? "<b>" + I18n.capitalize(item.get("lang")) + "</b>"
                                                    : I18n.capitalize(item.get("lang"))),
                                                on: {
                                                    click: function() {
                                                        I18n.setCurrentPlayerCode(item.get("code"));
                                                    }
                                                }
                                            };
                                        })
                                }
                            }]
                    }]);
            }
            this.menu.add([
                {
                    type: "Button",
                    label: I18n.tCap('global.logout'),
                    plugins: [{
                            fn: "OpenUrlAction",
                            cfg: {
                                url: "#/logout",
                                target: "self"
                            }
                        }]
                }]);
        },
        /**
         * @function
         * @private
         * @description Call widget parent to execute its proper sync function.
         * Set label of this button with team and/or player name.
         */
        syncUI: function() {
            Wegas.LoginButton.superclass.syncUI.apply(this, arguments);

            var cUser = Wegas.Facade.User.cache.get("currentUser"),
                cPlayer = Wegas.Facade.Game.cache.getCurrentPlayer(),
                cTeam = Wegas.Facade.Game.cache.getCurrentTeam(),
                mainAccount = cUser.getMainAccount(),
                gameModel = Wegas.Facade.GameModel.cache.getCurrentGameModel();

            /*if (mainAccount instanceof Wegas.persistence.GuestJpaAccount) { // If current account is a Guest,
             this.menu.getMenu().item(0).hide(); // hide the "Preference" button
             }*/

            if (this.get("forcedLabel")) {
                this.set("label", this.get("forcedLabel"));
            } else {
                if (cTeam && !(gameModel && gameModel.get("properties.freeForAll"))) {
                    this.set("label", cTeam.get("name") + " : " + cPlayer.get("name"));
                } else {
                    this.set("label", cPlayer.get("name") || "Undefined");
                }
            }
        },
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        /** @lends Y.Wegas.LoginButton */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>preferencePageId: Id of the the page which contains widget userPreferences</li>
         *    <li>targetPageLoader: Zone to display the page which contains widget userPreferences</li>
         * </ul>
         */
        ATTRS: {
            label: {
                "transient": true
            },
            forcedLabel: {
                type: "string",
                optional: true,
                view: {
                    label: "Label",
                    description: "Player name is used if blank"
                }
            },
            data: {
                "transient": true
            },
            /**
             * targetPageLoader: Zone to display the page which contains widget userPreferences
             */
            targetPageLoader: {
                type: "string",
                value: "maindisplayarea",
                view: {
                    label: "Target zone",
                    //_type: "pageloaderselect",//@fixme There a bug with this widget when the target page is not loaded
                    className: 'wegas-advanced-feature'
                }
            }
        }
    });
    Wegas.LoginButton = LoginButton;
    RestartButton = Y.Base.create("wegas-restart", Wegas.Button, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        bindUI: function() {
            this.on("click", function() {
                var autologin = this.get("autologin");
                Y.io(Y.Wegas.app.get("base") + "/rest/User/Logout", {//logout
                    on: {
                        success: function() {
                            if (autologin) {
                                var params = Helper.getURLParameters();
                                params["al"] = true;                            //autologin (guest)
                                Helper.setURLParameters(params);
                            } else {
                                window.location.reload();
                            }
                        }
                    }
                });
            });
        }
    }, {
        ATTRS: {
            label: {
                value: "Restart"
            },
            autologin: {
                value: true,
                type: "boolean",
                view: {
                    label: "Auto login",
                    description: "If allowed, will try to login with a new guest."
                }
            }
        }
    });
    Wegas.RestartButton = RestartButton;

    /**
     * @name Y.Wegas.LoginButton
     * @extends Y.Wegas.Button
     * @class  Button with a defined behavior.
     * @constructor
     * @description Button with special label and menu with two
     * options : set user preferences or logout
     */
    UserLoginButton = Y.Base.create("wegas-login", Wegas.Button, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.LoginButton# */
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description bind function to events.
         * Call widget parent to execute its proper bind function.
         * When UserFacade is updated, do syncUI
         * Add plugin menu with 2 options : open page "user preferences" and logout
         */
        bindUI: function() {
            this.handlers = {};
            this.handlers.userUpdate = Wegas.Facade.User.after("update", this.syncUI, this);
            if (Wegas.Facade.Variable)
                this.handlers.variableUpdate = Wegas.Facade.Variable.after("update", this.syncUI, this);

            if (this.menu) { // Don't add the plugin if it already exists
                return;
            }

            this.plug(Y.Plugin.WidgetMenu);

            this.menu.add([{
                    type: "Button",
                    label: "Themes",
                    "cssClass": "wegas-advanced-feature",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                event: "mouseenter",
                                menuCfg: {
                                    points: ["tr", "tl"]
                                },
                                children: [{
                                        label: "Default",
                                        on: {
                                            click: function() {
                                                Y.one("body").removeClass("wegas-ascii");
                                                Y.one("body").removeClass("wegas-round");
                                                Y.one("body").removeClass("wegas-dark");
                                                Y.Cookie.remove("customstyle");
                                            }
                                        }
                                    }, {
                                        label: "Roundish",
                                        on: {
                                            click: function() {
                                                Y.one("body").addClass("wegas-round");
                                                Y.one("body").removeClass("wegas-ascii");
                                                Y.one("body").removeClass("wegas-dark");
                                                Y.use("cookie", "wegas-editor-roundcss", function(Y) {
                                                    Y.Cookie.set("customstyle", "wegas-round");
                                                });
                                            }
                                        }
                                    }, {
                                        label: "Grisaille",
                                        on: {
                                            click: function() {
                                                Y.one("body").addClass("wegas-dark");
                                                Y.one("body").removeClass("wegas-ascii");
                                                Y.one("body").removeClass("wegas-round");
                                                Y.use("cookie", "wegas-editor-darkcss", function(Y) {
                                                    Y.Cookie.set("customstyle", "wegas-dark");
                                                });
                                            }
                                        }
                                    }, {
                                        label: "Deprecated Terminal",
                                        on: {
                                            click: function() {
                                                Y.one("body").addClass("wegas-ascii");
                                                Y.one("body").removeClass("wegas-round");
                                                Y.one("body").removeClass("wegas-dark");
                                                Y.use("cookie", "wegas-editor-asciicss", function(Y) {
                                                    Y.Cookie.set("customstyle", "wegas-ascii");
                                                });
                                            }
                                        }

                                    }
                                ]
                            }
                        }]
                }, {
                    type: "Button",
                    label: I18n.tCap('global.logout'),
                    plugins: [{
                            fn: "OpenUrlAction",
                            cfg: {
                                url: "#/logout",
                                target: "self"
                            }
                        }]
                }]);
        },
        /**
         * @function
         * @private
         * @description Call widget parent to execute its proper sync function.
         * Set label of this button with team and/or player name.
         */
        syncUI: function() {
            Wegas.LoginButton.superclass.syncUI.apply(this, arguments);

            /*
             var cUser = Wegas.Facade.User.get("currentUser"),
             name = cUser.get("name") || "undefined",
             mainAccount = cUser.getMainAccount();
             
             if (mainAccount) {
             name = "<img src=\"//www.gravatar.com/avatar/" + mainAccount.get("hash") + "?s=28&d=mm\" />" + name;
             }
             */
            this.set("label", '<i class="fa fa-sign-out" title="Logout"></i>');
        },
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        /** @lends Y.Wegas.LoginButton */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>labelIsUser: Select what kind of label you want (user/team  or team/player)</li>
         *    <li>preferencePageId: Id of the the page which contains widget userPreferences</li>
         *    <li>targetPageLoader: Zone to display the page which contains widget userPreferences</li>
         * </ul>
         */
        ATTRS: {
            label: {
                "transient": true
            }
        }
    });
    Wegas.UserLoginButton = UserLoginButton;
});
