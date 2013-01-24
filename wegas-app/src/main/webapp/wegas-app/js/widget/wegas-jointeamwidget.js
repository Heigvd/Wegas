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
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

YUI.add('wegas-jointeamwidget', function (Y) {
    "use strict";

    var JoinTeamWidget;

    /**
     *
     *  @class Y.Wegas.JoinTeamWidget
     */
    JoinTeamWidget = Y.Base.create("wegas-jointeamwidget", Y.Wegas.JoinGameWidget, [Y.WidgetChild, Y.Wegas.Widget], {

        renderUI: function () {
            JoinTeamWidget.superclass.renderUI.apply(this);
            this.tokenField.setValue(document.location.search.substring(7));
            this.sendJoinGame();
        },

        bindUI: function () {            
            JoinTeamWidget.superclass.bindUI.apply(this);
        },
        
        joinTeamSuccess: function () {
            this.showMessage("success", "Game joined", 10000);
            window.location.reload();
        }
    });

    Y.namespace('Wegas').JoinTeamWidget = JoinTeamWidget;
});
