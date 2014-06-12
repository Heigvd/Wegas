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

    var CONTENTBOX = "contentBox", GameInformation, Wegas = Y.Wegas;

    /**
     * @name Y.Wegas.JoinTeam
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class class for join a team
     * @constructor
     * @description Allows just to join a team
     */
    GameInformation = Y.Base.create("wegas-gameinformation", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
        /** @lends Y.Wegas.JoinTeam# */
        // *** Private fields *** //
        renderUI: function() {
            var entity = this.get("entity"),
                game = (entity instanceof Wegas.persistence.Team) ? Wegas.Facade.Game.cache.findById(entity.get("gameId"))
                : entity;

            Wegas.Facade.Game.cache.getWithView(game, "Extended", {//           // Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        var game = e.response.entity;
                        this.get(CONTENTBOX).append(GameInformation.renderGameInformation(game));
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
            entity: {}
        },
        renderGameInformation: function(game) {
            var information = new Y.Node.create('<div></div>'),
                imgSrc = game.get("properties.imageUri");
            if (imgSrc) {
                information.append('<img src=' + imgSrc + ' />');
            }
            information.append('<div class="title">' + game.get("gameModelName") + "</div>"
                + '<div class="gametitle">' + game.get("name") + "</div>"
                + '<div class="subtitle">' + game.get("createdByName") + " " + Wegas.Helper.smartDate(game.get("createdTime")) + "</div>");
            if (game.get("description")) {
                information.append('<div class="description"> ' + game.get("description") + '</div>');
            }
            information.append('<div style="clear: both"/>');
            return information.getHTML();
        }
    });
    Wegas.GameInformation = GameInformation;
});
