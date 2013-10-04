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
            this.fields = [];
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
            var i, ii, dt = this.get("host").datatable, cell, field, taskDesc;

            for (i = 0; i < dt.data._items.length; i++) {
                taskDesc = dt.data.item(i).get("descriptor");
                for (ii = 0; ii < dt.get('columns').length; ii++) {
                    if (dt.get('columns')[ii]._id === "bac") {
                        cell = dt.getRow(i).getDOMNode().cells[ii];
                        field = new Y.inputEx.StringField({value: taskDesc.getInstance().get("properties").bac, parentEl: cell, required: true, className: "bacField"});
                        field.taskDescId = taskDesc.get("id");
                        this.fields.push(field);

                    }
                }
            }
        },
        onKeyUpEvent: function() {
            var i, dt = this.get("host").datatable;
            this.get("host").datatable.delegate("keyup", function(e) {
                this.timer;

                if (this.timer) {
                    this.timer.cancel();
                }

                this.timer = Y.later(1000, this, function() {
                    if (e.charCode !== 9) {
                        if (this.isValidField(e.target.get("value"))) {
                            for (i = 0; i < dt.data.size(); i += 1) {
                                if (dt.getRow(i).contains(e.target)) {
                                    dt.getRecord(i).get("instance").properties.bac = e.target.get("value");
                                    this.request(dt.getRecord(i));
                                }
                            }
                        } else {
                            e.setValue(dt.getRecord(i).get("instance").properties.bac);
                        }
                    }
                });

            }, ".bacField input", this);
        },
        isValidField: function(value) {
            if (value === "") {
                this.get("host").showMessage("error", "Bac field cannot be null");
                return false;
            }
            else if (!parseInt(value)) {
                this.get("host").showMessage("error", "Value is not a number");
                return false;
            }
            return true;
        },
        request: function(taskDescriptor) {
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/" + taskDescriptor.get("id") + "/VariableInstance/" + taskDescriptor.get("instance").id,
                cfg: {
                    method: "PUT",
//                    updateCache: false,
                    updateEvent: false,
                    data: JSON.stringify(taskDescriptor.get("instance"))
                }
            });
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
