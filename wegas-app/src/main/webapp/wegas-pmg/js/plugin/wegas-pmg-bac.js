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
            });
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
                taskDesc = Y.Wegas.Facade.VariableDescriptor.cache.find("id", dt.data._items[i].get("id"));
                for (ii = 0; ii < dt.get('columns').length; ii++) {
                    if (dt.get('columns')[ii]._id === "bac") {
                        cell = dt.getRow(i).getDOMNode().cells[ii];
                        field = new Y.inputEx.Wegas.BACField({value: taskDesc.getInstance().get("properties").bac, parentEl: cell, required: true});
                        field.taskDescId = taskDesc.get("id");
                        this.fields.push(field);
                        this.onKeyUpEvent();
                    }
                }
            }
        },
        onKeyUpEvent: function() {
            var i, taskDesc, properties;

            for (i = 0; i < this.fields.length; i++) {
                this.fields[i].on("keyup", Y.bind(function(e) {
                    taskDesc = Y.Wegas.Facade.VariableDescriptor.cache.find("id", e.taskDescId);
                    properties = taskDesc.getInstance().get("properties");
                    if (this.isValidField(e.getValue())) {
                        properties.bac = e.getValue();
                        taskDesc.getInstance().set("properties", properties);
                        this.request(taskDesc);
                    } else {
                        e.setValue(properties.bac);
                    }

                }, this));
            }
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
                request: "/" + taskDescriptor.get("id") + "/VariableInstance/" + taskDescriptor.getInstance().get("id"),
                cfg: {
                    method: "PUT",
                    updateCache: false,
//                    updateEvent: false,
                    data: taskDescriptor.getInstance()
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

    // extends inputEx.StringField for overide onKeyUp function.
    Y.namespace("inputEx.Wegas").BACField = function(options) {
        Y.inputEx.Wegas.BACField.superclass.constructor.call(this, options);
    };

    Y.extend(Y.inputEx.Wegas.BACField, Y.inputEx.StringField, {
        onKeyUp: function(e) {
            this.timer;

            if (this.timer) {
                this.timer.cancel();
            }

            this.timer = Y.later(1000, this, function() {
                if (e.charCode !== 9) {
                    this.fire("keyup", this);
                }
            });


        }
    });
});
