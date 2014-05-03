/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-gameinformation', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.JoinTeam
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class class for join a team
     * @constructor
     * @description Allows just to join a team
     */
    var CONTENTBOX = "contentBox",
            GameInformation = Y.Base.create("wegas-gameinformation", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /** @lends Y.Wegas.JoinTeam# */
        // *** Private fields *** //

        renderUI: function() {
            var cb = this.get(CONTENTBOX), entity = this.get("entity"),
                    game = (entity instanceof Y.Wegas.persistence.Team) ? Y.Wegas.Facade.Game.cache.findById(entity.get("gameId"))
                    : entity;

            Y.Wegas.Facade.Game.cache.getWithView(game, "Extended", {/// Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        var game = e.response.entity;
                        cb.append(GameInformation.renderGameInformation(game));
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
            entity: {}
        },
        renderGameInformation: function(game) {
            var information = new Y.Node.create('<div></div>'), imgSrc = game.get("properties.imgSrc");
            if (game.get("properties.imgSrc")) {
                information.append('<img src=' + imgSrc + ' />');
            }
            information.append('<div class="title">' + game.get("gameModelName") + " <br />" + game.get("name") +
                    '</div><div class="subtitle">' + game.get("createdByName") + " " + Y.Wegas.Helper.smartDate(game.get("createdTime")));
            if (game.get("description")) {
                information.append('</div><div class="description"> ' + game.get("description") + '</div>');
            }
            information.append('<div style="clear: both"/>');
            return information.getHTML();
        }
    });
    Y.namespace('Wegas').GameInformation = GameInformation;
});
