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
YUI.add("wegas-loginbutton", function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.LoginButton
     * @extends Y.Wegas.Button
     * @class  Button with a defined behavior.
     * @constructor
     * @description Button with special label and menu with two
     * options : set user preferences or logout
     */
    var Wegas = Y.Wegas,
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
            Wegas.LoginButton.superclass.bindUI.apply(this, arguments);

            this.handlers = {};
            this.handlers.userUpdate = Wegas.Facade.User.after("update", this.syncUI, this);
            if (Wegas.Facade.VariableDescriptor)
                this.handlers.variableUpdate = Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            if (this.menu) {                                                    // Don't add the plugin if it already exist.
                return;
            }

            this.plug(Y.Plugin.WidgetMenu);
            if (!Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll")) {
                this.menu.add({
                    type: "Button",
                    label: "Edit Team",
                    plugins: [{
                            fn: "OpenPageAction",
                            cfg: {
                                subpageId: "Team",
                                targetPageLoaderId: this.get("targetPageLoader")
                            }
                        }]
                });
            }

            this.menu.add([{
                type: "Button",
                label: "Preferences",
                plugins: [{
                        fn: "OpenPageAction",
                        cfg: {
                            subpageId: "UserPreferences",
                            targetPageLoaderId: this.get("targetPageLoader")
                        }
                    }]
            }, {
                type: "Button",
                label: "Logout",
                plugins: [{
                        fn: "OpenUrlAction",
                        cfg: {
                            url: "logout",
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

            var cUser = Wegas.Facade.User.get("currentUser"),
                    cPlayer = Wegas.Facade.Game.cache.getCurrentPlayer(),
                    cTeam = Wegas.Facade.Game.cache.getCurrentTeam(),
                    name = cUser.get("name") || "undefined",
                    mainAccount = cUser.getMainAccount(),
                    gameModel = Wegas.Facade.GameModel.cache.getCurrentGameModel();

            if (mainAccount) {
                name = "<img src=\"http://www.gravatar.com/avatar/" + mainAccount.get("hash") + "?s=28&d=mm\" />" + name;
            }

            if (mainAccount instanceof Wegas.persistence.GuestJpaAccount) {   // If current account is a Guest,
                this.menu.getMenu().item(0).hide();                             // hide the "Preference" button
            }

            if (!this.get('labelIsUser')) {
                if (cPlayer) {
                    name = cPlayer.get("name");
                }
                if (cTeam) {
                    name = cTeam.get("name") + " : " + name;
                }
                if (gameModel && gameModel.get("properties.freeForAll")) {
                    name = cPlayer.get("name");
                }
            }
            if (!this.get("label")) {
                this.set("label", name);
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
         *    <li>labelIsUser: Select what kind of label you want (user/team  or team/player)</li>
         *    <li>preferencePageId: Id of the the page which contains widget userPreferences</li>
         *    <li>targetPageLoader: Zone to display the page which contains widget userPreferences</li>
         * </ul>
         */
        ATTRS: {
            label: {
                "transient": true
            },
            data: {
                "transient": true
            },
            /**
             * Select what kind of label you want (user/team  or team/player)
             */
            labelIsUser: {
                value: false,
                validator: function(b) {
                    return (b === 'true' || b === true);
                }
            },
            /**
             * targetPageLoader: Zone to display the page which contains widget userPreferences
             */
            targetPageLoader: {
                value: "maindisplayarea",
                _inputex: {
                    label: "Target zone",
                    _type: "string",
                    //_type: "pageloaderselect",//@fixme There a bug with this widget when the target page is not loaded
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            }
        }
    });
    Y.namespace('Wegas').LoginButton = LoginButton;
});
