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
YUI.add('wegas-scheduledatatable', function(Y) {
    "use strict";

    /**
     *  @class Add column to datatable
     *  @name Y.Plugin.scheduleDT
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
            ScheduleDT = Y.Base.create("wegas-scheduledatatable", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.CSSStyles */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = {};
            this.get("host").onceAfter("render", function() {
                this.set("columnToAdd", this.get("columnToAdd"));
            }, this);

            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", function() {
                this.set("columnToAdd", this.get("columnToAdd"));
            }, this);
        },
        /**
         * @function
         * @private
         * @description setValue of column
         */
        setColumn: function(newval, preval) {
            var i;
            if (preval) {
                for (i = 1; i <= preval; i++) {
                    this.get("host").datatable.removeColumn(i);
                }
            }
            if (newval) {
                var table = this.get("host").datatable, i;
                for (i = 1; i <= newval; i++) {
                    if (i === this.currentPeriod()) {
                        table.addColumn({key: i.toString(), className: "schedulColumn present", time: i});
                    } else if (i < this.currentPeriod()) {
                        table.addColumn({key: i.toString(), className: "schedulColumn past", time: i});
                    } else {
                        table.addColumn({key: i.toString(), className: "schedulColumn futur", time: i});
                    }

                }
            }
        },
        currentPeriod: function() {
            var variable = this.get('variable.evaluated');
            if (!variable){
                this.get("host").showMessage("error", "No variable found");
                return;
            }
            return variable.getInstance().get("value");
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        ATTRS: {
            columnToAdd: {
                setter: function(val) {
                    this.setColumn(val, this.get("columnToAdd"));
                    return val;
                },
                _inputex: {
                    _type: "integer",
                    label: "No of column"
                }
            },
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Periode variable"
                }
            }
        },
        NS: "scheduleDT",
        NAME: "ScheduleDT"
    });
    Y.namespace("Plugin").ScheduleDT = ScheduleDT;
});
