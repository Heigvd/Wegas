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
            var gameModels = Y.Wegas.Facade.GameModel.cache.findAll();

            options.choices = [];
            options.filters = options.filters || {};

            Y.Array.each(gameModels, function(gm) {
                if (Y.Object.some(options.filters, function(value, key) {
                    return gm.get(key) === value;
                })) {                                                           // If the game model does not match any filter
                    options.choices.push({// add it to available games
                        label: gm.get("name"),
                        value: gm.get("id")
                    });
                }
            });
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
     * @class Y.inputEx.Wegas.EnrolmentKeyList
     * @extends Y.inputEx.ListField
     * @constructor
     * @param {Object} options  options object
     * <ul>
     *   <li></li>
     * </ul>
     */
    var EnrolmentKeyList = function(options) {
        EnrolmentKeyList.superclass.constructor.call(this, options);
    };
    Y.extend(EnrolmentKeyList, Y.inputEx.ListField, {
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
                        type: "uneditable"
                                //type: "string"
                    }, {
                        name: "used",
                        value: false,
                        type: "hidden"
                    }]
            };

            EnrolmentKeyList.superclass.setOptions.call(this, options);
        },
        addElement: function(value) {
            var subfield = EnrolmentKeyList.superclass.addElement.call(this, value),
                    node = new Y.Node(subfield.divEl);

            node.all(".inputEx-Field").each(function(n) {
                n.setContent("<span class='wegas-enrolmentkey'>" + n.getContent() + "</span>,&nbsp;");
            });
            (new Y.Node(this.divEl)).all(".inputEx-ListField-delButton").remove(true); // Remove delete button
            (new Y.Node(this.divEl)).all(".inputEx-ListField-childContainer > div").setStyle("float", "left");

            if (value.used) {
                node.all(".inputEx-Field span").setStyle("textDecoration", "line-through");// strike through used tokens
                //f.disable();
                //(new Y.Node(this.subFields[i].divEl)).all("input").setStyle("textDecoration", "line-through");
            }
            return subfield;
        },
        /**
         * Add a new element to the list and fire updated event
         * @method onAddButton
         * @param {Event} e The original click event
         */
        onAddButton: function(e) {
            e.halt();
            var i, total = this.promptMessage(),
                    game = this.parentField.parentWidget.get("entity"),
                    //teamCount = game.get("teams").length+1,
                    teamCount = this.subFields.length + 1,
                    prefix = game.get("token");

            for (i = 0; i < total; i += 1) {                                    // Add key fields
                this.addElement({
                    key: prefix + "-" + teamCount
                });
                teamCount += 1;
            }
            this.fireUpdatedEvt();                                              // Fire updated !
        },
        promptMessage: function() {
            return prompt("How many keys do you want to generate?");
        }
    });
    Y.inputEx.registerType("enrolmentkeylist", EnrolmentKeyList);               // Register this class

    /**
     * @class Y.inputEx.Wegas.AccountKeyList
     * @extends Y.inputEx.EnrolmentKeyList
     * @constructor
     * @param {Object} options  options object
     * <ul>
     *   <li></li>
     * </ul>
     */
    var AccountKeyList = function(options) {
        AccountKeyList.superclass.constructor.call(this, options);
    };
    Y.extend(AccountKeyList, EnrolmentKeyList, {
        setOptions: function(options) {
            options.elementType = options.elementType || {
                type: "group",
                label: "",
                required: true,
                fields: [{
                        name: "@class",
                        type: "hidden",
                        value: "GameAccountKey"
                    }, {
                        name: "id",
                        type: "hidden"
                    }, {
                        name: "key",
                        type: "uneditable"
                                //type: "string"
                    }, {
                        name: "used",
                        value: false,
                        type: "hidden"
                    }]
            };

            AccountKeyList.superclass.setOptions.call(this, options);
        },
        addElement: function(value) {
            var subfield = EnrolmentKeyList.superclass.addElement.call(this, value),
                    node = new Y.Node(subfield.divEl);

            node.all(".inputEx-Field").each(function(n) {
                n.setContent("<p class='wegas-accountkey'><span class='wegas-accountkeyUser'>User: </span><span>" + n.getContent() + "</span>\n\
                                <span class='wegas-accountkeyPass'>Pwd: </span><span>" + n.getContent() + "</span></p>");
            });
            (new Y.Node(this.divEl)).all(".inputEx-ListField-delButton").remove(true); // Remove delete button
            (new Y.Node(this.divEl)).all(".inputEx-ListField-childContainer > div").setStyles({"float": "left", "marginRight": "10px", "paddingRight": "10px"});

            if (value.used) {
                node.all(".inputEx-Field span").setStyle("textDecoration", "line-through");// strike through used tokens
                //f.disable();
                //(new Y.Node(this.subFields[i].divEl)).all("input").setStyle("textDecoration", "line-through");
            }
            return subfield;
        },
        promptMessage: function() {
            return prompt("How many username/passwords do you want to generate?");
        }
    });
    Y.inputEx.registerType("accountkeylist", AccountKeyList);               // Register this class

});
