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
            this.handlers = [];
//            this.after("columnToAddChange", function(e) {
//                this.setColumn(e.newVal, e.prevVal);
//            })
//            this.get("host").onceAfter("render", function() {
//                this.set("columnToAdd", this.get("columnToAdd"));
//            }, this);

            this.handlers.push(Y.Wegas.Facade.VariableDescriptor.after("update", function() {
                this.setTime(this.get("columnToAdd"));
//                this.set("columnToAdd", this.get("columnToAdd"));
            }, this));
        },
        /**
         * @function
         * @private
         * @description setValue of column
         */
        setColumn: function(newval, preval) {
            var diff = newval - (preval ? preval : 0),
                    table = this.get("host").datatable,
                    period = this.currentPeriod(),
                    bindedCP = Y.bind(this.currentPeriod, this),
                    classTime,
                    formatter = function(o) {
                if (bindedCP() < o.column.time) {
                    o.className = "futur";
                } else if (bindedCP() === o.column.time) {
                    o.className = "present";
                } else {
                    o.className = "past";
                }
                return "";

            };
            while (diff) {
                if (diff > 0) {
                    if ((newval - diff + 1) === period) {
                        classTime = "present";
                    } else if ((newval - diff + 1) > period) {
                        classTime = "futur";
                    } else {
                        classTime = "past";
                    }
                    table.addColumn({key: (newval - diff + 1).toString(), time: (newval - diff + 1), className: "schedulColumn " + classTime, formatter: formatter});
                    diff -= 1;
                } else {
                    table.removeColumn(newval - diff);
                    diff += 1;
                }
            }
            this.setTime();

        },
        setTime: function() {
            var i, table = this.get("host").datatable, period = this.currentPeriod();
            if (table.head) {
                table.head.theadNode.all(".schedulColumn").each(function(item, index) {
                    item.removeClass("present futur past");
                    if (period === index + 1) {
                        item.addClass("present");
                    } else if (period < index + 1) {
                        item.addClass("futur");
                    } else {
                        item.addClass("past");
                    }
                }, this);
            }
        },
        currentPeriod: function() {
            var variable = this.get('variable.evaluated');
            if (!variable) {
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
           // this.set("columnToAdd", 0);
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
                delete this.handlers[i];
            }
        }
    }, {
        ATTRS: {
            columnToAdd: {
                setter: function(val) {
                    this.setColumn(val, this.get("columnToAdd"));
                    return val;
                },
                lazyAdd: false,
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
