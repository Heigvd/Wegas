/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
     * @name Y.Wegas.GameInformation
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class 
     * @constructor
     * @description 
     */
    GameInformation = Y.Base.create("wegas-gameinformation", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
        /** @lends Y.Wegas.GameInformation# */
        // *** Private fields *** //
        renderUI: function() {
            var entity = this.get("entity"),
                game = (entity instanceof Wegas.persistence.Team) ? Wegas.Facade.Game.cache.findById(entity.get("gameId"))
                : entity;

            Wegas.Facade.Game.cache.getWithView(game, "Extended", {//           // Get the game model full description
                on: {
                    success: Y.bind(function(e) {
                        var game = e.response.entity;
                        this.get(CONTENTBOX).setHTML(GameInformation.renderGameInformation(game));
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
            entity: {}
        },
        renderGameInformation: function(game) {
            var imageUri = Y.Plugin.Injector.getImageUri(game.get("properties.imageUri"), game.get("gameModelId"));
            return '<div>'
                + (game.get("properties.imageUri") ? '<img src=\"' + imageUri + '\" />' : "")
                + '<div class="title">' + game.get("name") + "</div>"
                + '<div class="gametitle">' + game.get("gameModelName") + "</div>"
                + '<div class="subtitle">Created by ' + game.get("createdByName") + " " + Wegas.Helper.smartDate(game.get("createdTime"), true) + "</div>"
                + (game.get("gameModel").get("description") ? '<div class="description"> ' + game.get("gameModel").get("description") + '</div>' : "")
                + '<div style="clear: both"/></div>';
        }
    });
    Wegas.GameInformation = GameInformation;
});
