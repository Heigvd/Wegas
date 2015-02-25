/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
                        type: "string",
                        disable: true
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
            var subfield = EnrolmentKeyList.superclass.addElement.call(this, value);

            //Y.one(this.divEl).all(".inputEx-ListField-childContainer > div").setStyle("float", "left");

            subfield.getFieldByName("key").disable();

            if (value.used) {
                Y.one(subfield.divEl).all("input").setStyle("textDecoration", "line-through");// strike through used tokens
                //Y.one(subfield.divEl).all("+ .inputEx-ListField-delButton").remove(true); // Remove delete button
            }
            return subfield;
        },
        /**
         * 
         */
        renderComponent: function() {
            EnrolmentKeyList.superclass.renderComponent.call(this);
            Y.one(this.addButton).hide();
            var container = Y.one(this.fieldContainer);
            container.append("<div class='addkey' >Add <input value='1'/> <span class='label'>enrolment keys</span> <button class='yui3-button'><span></span>Add</button>");
            container.one("button").on("click", this.onAddButton, this);
        },
        /**
         * Add a new element to the list and fire updated event
         * @method onAddButton
         * @param {Event} e The original click event
         */
        onAddButton: function(e) {
            e.halt();
            var i, total = parseInt(Y.one(this.fieldContainer).one('.addkey input ').get("value")),
                game = this.parentField.parentWidget.get("entity"),
                prefix = game.get("token"),
                usedNumber, max, num;

            usedNumber = this.subFields.map(function(e) {
                return +e.getFieldByName("key").getValue().replace(/.*-.{2}-/, "");
            }).sort(Y.Array.numericSort);
            max = usedNumber[usedNumber.length - 1] || 0;

            if (!Y.Lang.isNumber(total)) {
                this.showMessage("error", "Invalid number");
                return;
            }

            for (i = 1; i <= total; i += 1) {                                    // Add key fields
                num = max + i;
                this.addElement({
                    key: prefix + "-" + (num < 10 ? "0":"") + (num)
                });
            }
            this.fireUpdatedEvt();                                              // Fire updated !
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
                        type: "string",
                        size: 12,
                        disable: true
                            //type: "string"
                    }, {
                        name: "used",
                        value: false,
                        type: "hidden"
                    }]
            };
            AccountKeyList.superclass.setOptions.call(this, options);
        },
        renderComponent: function() {
            AccountKeyList.superclass.renderComponent.call(this);
            Y.one(this.fieldContainer).one(".label").setContent("usernames/passwords");
        },
        addElement: function(value) {
            var subfield = EnrolmentKeyList.superclass.addElement.call(this, value),
                node = Y.one(subfield.divEl);

            node.all(".inputEx-Field").each(function(n) {
                n.setContent("<p class='wegas-accountkey'><span class='wegas-accountkeyUser'>User: </span><span>" + value.key + "</span>\n\
                                <span class='wegas-accountkeyPass'>Pwd: </span><span>" + value.key + "</span></p>");
            });

            if (value.used) {
                Y.one(this.divEl).all(".inputEx-ListField-delButton").remove(true); // Remove delete button
                node.all(".inputEx-Field span").setStyle("textDecoration", "line-through");// strike through used tokens
            }
            return subfield;
        }
    });
    Y.inputEx.registerType("accountkeylist", AccountKeyList);               // Register this class

});
