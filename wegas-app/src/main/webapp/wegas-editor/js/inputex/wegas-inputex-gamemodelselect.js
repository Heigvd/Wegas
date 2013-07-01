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
YUI.add("wegas-inputex-gamemodelselect", function(Y) {
    "use strict";

    /**
     * @class Y.inputEx.Wegas.GameModelSelect
     * @extends Y.inputEx.SelectField
     * @constructor
     * @param {Object} options  options object
     * <ul>
     *   <li></li>
     * </ul>
     */
    var GameModelSelect = function(options) {
        GameModelSelect.superclass.constructor.call(this, options);
    };

    Y.extend(GameModelSelect, Y.inputEx.SelectField, {
        setOptions: function(options) {
            var i, gameModels = Y.Wegas.Facade.GameModel.cache.findAll();

            options.choices = [];
            options.filters = options.filters || {};

            for (i = 0; i < gameModels.length; i += 1) {

                if (Y.Object.some(options.filters, function(value, key) {
                    return this.get(key) === value;
                }, gameModels[i])) {                                            // If the game model does not match any filter
                    options.choices.push({                                      // add it to available games
                        label: gameModels[i].get("name"),
                        value: gameModels[i].get("id")
                    });
                }
            }
            GameModelSelect.superclass.setOptions.call(this, options);

            // this.options.filter = options.filter || {};
        },
        setValue: function(value, fireUpdateEvent) {

            if ((!value || value === "")
                    && !!Y.Wegas.GameModelTreeView.currentGameModel) {
                value = Y.Wegas.GameModelTreeView.currentGameModel.get("id");
            }

            GameModelSelect.superclass.setValue.call(this, value, fireUpdateEvent);
        }

    });

    Y.inputEx.registerType("gamemodelselect", GameModelSelect);                 // Register this class
    Y.namespace("inputEx.Wegas").GameModelSelect = GameModelSelect;

});
