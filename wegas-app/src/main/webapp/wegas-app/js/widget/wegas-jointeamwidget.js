/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @deprecated User wegas-jointeam instead
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-jointeamwidget', function (Y) {
    "use strict";

    /**
    * @name Y.Wegas.JoinTeamWidget
    * @extends Y.Wegas.JoinGameWidget
    * @augments Y.WidgetChild
    * @augments Y.Wegas.Widget
    * @class class for join a team
    * @constructor
    * @description Allows just to join a team
    */
    var JoinTeamWidget = Y.Base.create("wegas-jointeamwidget", Y.Wegas.JoinGameWidget, [Y.WidgetChild, Y.Wegas.Widget], {
        /** @lends Y.Wegas.JoinTeamWidget */

        /**
         * @function
         * @private
         * @description Difference compared to the parent class:
         * 1) token is get from the url
         * 2) then call directly the sendJoinGame()
         */
        renderUI: function () {
            JoinTeamWidget.superclass.renderUI.apply(this);
            this.tokenField.setValue(document.location.search.substring(7));
            this.sendJoinGame();
        },

        /**
         * @function
         * @private
         */
        bindUI: function () {
            JoinTeamWidget.superclass.bindUI.apply(this);
        },

        /**
         * @function
         * @private
         * @description Reload the same page
         */
        joinTeamSuccess: function () {
            this.showMessage("success", "Game joined", 10000);
            window.location.reload();
        }
    });

    Y.namespace('Wegas').JoinTeamWidget = JoinTeamWidget;
});
