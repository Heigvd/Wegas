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
YUI.add('wegas-pmg-bac', function(Y) {
    "use strict";

    /**
     *  @class add Bac
     *  @name Y.Plugin.Bac
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
            Bac = Y.Base.create("wegas-pmg-bac", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Bac */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.onceAfterHostEvent("render", function() {
                this.addBacColumn();
                this.addInputField();
                this.afterHostMethod("syncUI", this.addInputField);
                this.onKeyUpEvent();
            });
            this.get("host").datatable.after("sort", this.addInputField, this);
        },
        addBacColumn: function() {
            this.get("host").datatable.addColumn({
                key: 'bac',
                label: "BAC"
            }, this.get("columnPosition"));
        },
        addInputField: function() {
            var i, dt = this.get("host").datatable, cell, field, taskDesc;

            for (i = 0; i < dt.data._items.length; i++) {
                taskDesc = dt.data.item(i).get("descriptor");
                cell = dt.getCell([i, this.get("columnPosition")]);
                field = Y.Node.create("<input class='bacField'></input>");
                field.set("value", taskDesc.getInstance().get("properties").bac);
                cell.append(field);
            }
        },
        onKeyUpEvent: function() {
            var dt = this.get("host").datatable;
            this.changeHandle = this.get("host").datatable.delegate("change", function(e) {
                var record = dt.getRecord(e.target), val = Y.Lang.trim(e.target.get("value"));
                val = (val === "") ? "0" : val; //empty is 0
                e.target.removeClass("invalid");
                if (this.isValidField(val)) {
                    val = parseInt(val, 10) + ""; // Remove leading 0 : binary number
                    e.target.set("value", val);
                    if (record && record.get("instance").properties.bac + "" !== val) {
                        record.get("instance").properties.bac = val;
                        this.request(record);
                    }
                } else {
                    e.target.addClass("invalid");
                }
            }, ".bacField", this);
        },
        isValidField: function(value) {
            var regexp = /^[+]?\d+$/; //positive number
            if (!regexp.test(value)) {
                this.get("host").showMessage("error", "\"" + value + "\" is not a positive integer");
                return false;
            }
            return true;
        },
        request: function(taskDescriptor) {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    updateCache: false,
                    updateEvent: false,
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        language: "JavaScript",
                        content: "importPackage(com.wegas.core.script);\nVariableDescriptorFacade.findByName(self.getGameModel(), '" + taskDescriptor.get("name") +"').getInstance(self).setProperty('bac', '" + taskDescriptor.get("instance").properties.bac + "');"
                    })
                }
            });
        },
        destructor: function() {
            this.changeHandle.detach();
            this.get("host").datatable.removeColumn("bac");                     /* Time consuming */
        }
    }, {
        ATTRS: {
            columnPosition: {
                value: 2,
                _inputex: {
                    _type: "integer",
                    label: "Column position"
                }
            }
        },
        NS: "bac",
        NAME: "Bac"
    });
    Y.namespace("Plugin").Bac = Bac;
});
