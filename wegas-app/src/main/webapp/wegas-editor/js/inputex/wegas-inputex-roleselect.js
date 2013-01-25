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
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-roleselect", function (Y) {
    "use strict";

    var RoleSelect;

    /**
     * Adds an url regexp, and display the favicon at this url
     * @class inputEx.UrlField
     * @extends inputEx.StringField
     * @constructor
     * @param {Object} options inputEx.Field options object
     * <ul>
     *   <li>favicon: boolean whether the domain favicon.ico should be displayed or not (default is true, except for https)</li>
     * </ul>
     */
    RoleSelect = function (options) {
        RoleSelect.superclass.constructor.call(this, options);
    };

    Y.extend(RoleSelect, Y.inputEx.SelectField, {
        setValue: function (val, sendUpdatedEvent) {
            this.value = val;
            RoleSelect.superclass.setValue.call(this, val.id, sendUpdatedEvent);
        },
        getValue: function () {
            return {
                "@class": "Role",
                name: "",
                description: "",
                id: RoleSelect.superclass.getValue.call(this)
            };
        },
        setOptions: function (options) {
            this.options.choices = [];
            RoleSelect.superclass.setOptions.call(this, options);
        },
        render: function () {
            RoleSelect.superclass.render.call(this, options);
            Y.Wegas.RoleFacade.rest.sendRequest({
                request: "/",
                on: {
                    success: Y.bind(function () {
                        this.renderOptions(Y.Wegas.RoleFacade.data)
                    }, this)
                }
            });

        },
        renderOptions: function (options) {
            var i;
            for (i = 0; i < options.length; i = i + 1) {
                this.createChoiceNode()
                this.options.choices.push({
                    value: Y.Wegas.RoleFacade.data[i].get("id"),
                    label: Y.Wegas.RoleFacade.data[i].get("name")
                });
            }

        }
    });

    Y.namespace("inputEx.Wegas").RoleSelect = RoleSelect;
    Y.inputEx.registerType("roleselect", RoleSelect);               // Register this class as "wegasurl" type
});
