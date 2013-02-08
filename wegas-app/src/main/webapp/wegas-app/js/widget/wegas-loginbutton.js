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
YUI.add("wegas-loginbutton", function (Y) {
    "use strict";

    var LoginButton;

    /**
     * @name Y.Wegas.LoginButton
     * @extends Y.Wegas.Button
     * @class  Button with a defined behavior.
     * @constructor
     * @description Button with special label and menu with two
     * options : set user preferences or logout
     */
    LoginButton = Y.Base.create("wegas-login", Y.Wegas.Button, [], {
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
        bindUI: function () {
            Y.Wegas.LoginButton.superclass.bindUI.apply(this, arguments);
            Y.Wegas.UserFacade.after("update", this.syncUI, this);

            if (this.menu) {                                                    // Don't add the plugin if it already exist.
                return;
            }

            this.plug(Y.Plugin.WidgetMenu, {
                children: [{
                    type: "Button",
                    label: "Preferences",
                    plugins: [{
                        "fn": "OpenPageAction",
                        "cfg": {
                            "subpageId": this.get("preferencePageId"), // @fixme
                            "targetPageLoaderId": this.get("targetPageLoader")
                        }
                    }]
                }, {
                    type: "Button",
                    label: "Logout",
                    plugins: [{
                        fn: "OpenUrlAction",
                        cfg: {
                            url: "wegas-app/logout",
                            target: "self"
                        }
                    }]
                }]
            });
        },

        /**
         * @function
         * @private
         * @description Call widget parent to execute its proper sync function.
         * Set label of this button with team and/or player name.
         */
        syncUI: function () {
            Y.Wegas.LoginButton.superclass.syncUI.apply(this, arguments);

            var cUser = Y.Wegas.app.get("currentUser"),
            cPlayer = Y.Wegas.GameFacade.rest.getCurrentPlayer(),
            cTeam = Y.Wegas.GameFacade.rest.getCurrentTeam(),
            name = cUser.name || "undefined";
            if (!this.get('labelIsUser')) {
                if (cPlayer) {
                    name = cPlayer.get("name");
                }
                if (cTeam) {
                    name = cTeam.get("name") + " : " + name;
                }
            }
            this.set("label", name);
        }
    }, {
        /**
         * @lends Y.Wegas.LoginButton
         */

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
            /**
             * Select what kind of label you want (user/team  or team/player)
             */
            labelIsUser: {
                value: false,
                validator: function (b) {
                    return (b === 'true' || b === true);
                }
            },
            /**
             * Id of the the page which contains widget userPreference
             */
            preferencePageId: {
                value: 1000                                                     //@fixme
            },
            /**
             * targetPageLoader: Zone to display the page which contains widget userPreferences
             */
            targetPageLoader: {
                value: "maindisplayarea"
            }
        }
    });
    Y.namespace('Wegas').LoginButton = LoginButton;

});
