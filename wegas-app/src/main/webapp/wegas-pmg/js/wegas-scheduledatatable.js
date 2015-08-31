/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
/*global YUI*/
YUI.add('wegas-scheduledatatable', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, ScheduleDT;

    /**
     *  @class Add column to datatable
     *  @name Y.Plugin.ScheduleDT
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    ScheduleDT = Y.Base.create("wegas-scheduledatatable", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.ScheduleDT */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.sync();
            this.updateHandler = Wegas.Facade.Variable.after("update", this.sync, this);
        },
        sync: function() {
            Y.log("sync()", "log", "Wegas.ScheduleDT");
            this.__currentPhase = this._currentPhase();                       // Cache current phase value
            this.__currentPeriod = this._currentPeriod();                       // Cache current period value
            this.setColumn(this.getNumberOfColumn());
            this.setTime();
        },
        /**
         * @function
         * @private
         * @description setValue of column
         */
        getNumberOfColumn: function() {
            return Math.max(this.currentPeriod(), this.initialMaximum());
        },
        setColumn: function(newval) {
            var diff = newval - (this.currentVal ? this.currentVal : 0),
                table = this.get("host").datatable,
                formatter = Y.bind(function(o) {
                    o.className = this.getClass(o.column.time);
                    return "";
                }, this);

            while (diff) {
                if (diff > 0) {
                    table.addColumn({
                        key: (newval - diff + 1).toString(),
                        time: (newval - diff + 1),
                        className: "schedulecolumn ",
                        //className: "schedulecolumn " + this.getClass(newval - diff + 1),
                        formatter: formatter
                    });
                    diff -= 1;
                } else {
                    table.removeColumn(newval - diff);
                    diff += 1;
                }
            }
            this.currentVal = newval;
        },
        getClass: function(time) {
            if (time === this.currentPeriod()) {
                return "present";
            } else if (time > this.currentPeriod()) {
                return "futur";
            } else {
                return  "past";
            }
        },
        setTime: function() {
            var table = this.get("host").datatable;

            if (table.head) {
                table.head.theadNode.all(".schedulecolumn").each(function(item, index) {
                    item.removeClass("present")
                        .removeClass("futur")
                        .removeClass("past")
                        .addClass(this.getClass(index + 1));
                }, this);
            }
        },
        currentPhase: function() {
            return this.__currentPhase;
        },
        _currentPhase: function() {
            var variable = Wegas.Facade.Variable.cache.find("name", "currentPhase");
            if (!variable) {
                this.get("host").showMessage("error", "No variable found");
                return null;
            }
            return variable.getInstance().get("value");
        },
        currentPeriod: function() {
            return this.__currentPeriod;
        },
        _currentPeriod: function() {
            var variable = this.get('variable.evaluated');
            if (!variable) {
                this.get("host").showMessage("error", "No variable found");
                return null;
            }
            return variable.getInstance().get("value");
        },
        initialMaximum: function() {
            var variable = Wegas.Facade.Variable.cache.find("name", "executionPeriods");
            if (!variable) {
                this.get("host").showMessage("error", "No variable found");
                return null;
            }
            return variable.getInstance().get("value");
        },
        getCell: function(rowIndex, time) {
            var add = this.get("host").assignment ? 1 : 0;                      // @hack
            return this.get("host").datatable.getCell([rowIndex, this.get("host").get("columnsCfg").length + time - 1 + add]);
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            Y.log("destructor()", "log", "Wegas.ScheduleDT");
            this.updateHandler.detach();
        }
    }, {
        ATTRS: {
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Periode variable"
                }
            }
        },
        NS: "schedule"
    });
    Y.Plugin.ScheduleDT = ScheduleDT;
});
