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
                    options.choices.push({// add it to available games
                        label: gameModels[i].get("name"),
                        value: gameModels[i].get("id")
                    });
                }
            }
            GameModelSelect.superclass.setOptions.call(this, options);
        },
        setValue: function(value, fireUpdateEvent) {
            if ((!value || value === "")
                    && !!Y.Plugin.EditorDTMenu.currentGameModel) {
                value = Y.Plugin.EditorDTMenu.currentGameModel.get("id");
            }
            GameModelSelect.superclass.setValue.call(this, value, fireUpdateEvent);
        }
    });

    Y.inputEx.registerType("gamemodelselect", GameModelSelect);                 // Register this class
    Y.namespace("inputEx.Wegas").GameModelSelect = GameModelSelect;


    /**
     * @class Y.inputEx.Wegas.EnrolementKeyList
     * @extends Y.inputEx.ListField
     * @constructor
     * @param {Object} options  options object
     * <ul>
     *   <li></li>
     * </ul>
     */
    var EnrolementKeyList = function(options) {
        EnrolementKeyList.superclass.constructor.call(this, options);
    };

    Y.extend(EnrolementKeyList, Y.inputEx.ListField, {
        setOptions: function(options) {
            options.elementType = options.elementType || {
                type: "group",
                label: "",
                required: true,
                fields: [{
                        name: "@class",
                        type: "hidden",
                        value: "GameEnrolmentKey"
                    }, {
                        name: "key",
//                        type: "string"
                        type: "uneditable"
                    }, {
                        name: "used",
                        value: false,
                        type: "hidden"
                    }]
            };

            EnrolementKeyList.superclass.setOptions.call(this, options);
        },
        renderComponent: function() {
            EnrolementKeyList.superclass.renderComponent.call(this);
            var i;
            (new Y.Node(this.divEl)).all(".inputEx-ListField-delButton").remove(true);

            for (i = 0; i < this.subFields.length; i++) {
                this.subFields[i].disable();
                (new Y.Node(this.subFields[i])).all(".inputEx-ListField-delButton").remove(true);
            }
        },
        /**
         * Add a new element to the list and fire updated event
         * @method onAddButton
         * @param {Event} e The original click event
         */
        onAddButton: function(e) {
            e.halt();
            var i, total = prompt("How many key do you want to generate?"),
                    game = this.parentField.parentWidget.get("entity"),
                    //teamCount = game.get("teams").length,
                    teamCount = Math.max(this.subFields.length, 1);

            //if (lang.isNumber(this.options.maxItems) && this.subFields.length >= this.options.maxItems) {// Prevent adding a new field if already at maxItems
            //    return;
            //}

            for (i = 0; i < total; i++) {
                var e = this.addElement({
                    key: game.get("name") + "-" + teamCount
                });                                                             // Add a field
                (new Y.Node(e.divEl)).all(".inputEx-Field").each(function(n) {
                    n.setContent("<span>" + n.getContent() + "</span>,&nbsp;");
                });
                teamCount++;
            }
            (new Y.Node(this.divEl)).all(".inputEx-ListField-delButton").remove(true);
            (new Y.Node(this.divEl)).all(".inputEx-ListField-childContainer > div").setStyles({
                float: "left"
            });

            //for (i = 0; i < this.subFields.length; i++) {
            //    this.subFields[i].disable();
            //}
            for (i = 0; i < 2; i++) {
                (new Y.Node(this.subFields[i].divEl)).all("input").setStyle("textDecoration", "line-through");
                (new Y.Node(this.subFields[i].divEl)).all(".inputEx-Field span").setStyle("textDecoration", "line-through");
            }
            this.fireUpdatedEvt();                                              // Fire updated !
        }
    });

    Y.inputEx.registerType("enrolementkeylist", EnrolementKeyList);                 // Register this class
});
