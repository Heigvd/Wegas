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
YUI.add('wegas-pmg-plannificationprogresscolor', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, PlannificationProgressColor;

    /**
     *  @class color plannification progress in datatable
     *  @name Y.Plugin.PlannificationProgressColor
     *  @extends Y.Plugin.AbstractPert
     *  @constructor
     */
    PlannificationProgressColor = Y.Base.create("wegas-pmg-plannificationprogresscolor", Y.Plugin.AbstractPert, [], {
        /** @lends Y.Plugin.PlannificationProgressColor */
        initializer: function() {
            this.onceAfterHostEvent("render", function() {
                this.sync();
                this.afterHostMethod("syncUI", this.sync);
                this.get("host").datatable.after("sort", this.sync, this);
            });
        },
        sync: function() {
            this.taskTable = {};
            this.fillTaskTable();
            this.computePert(this.taskTable, this.get("host").schedule.currentPeriod());
            this.findCell();
        },
        fillTaskTable: function() {
            var i, taskDesc, taskInst, properties,
                dt = this.get("host").datatable;

            for (i = 0; i < dt.data.size(); i++) {
                taskDesc = dt.getRecord(i).get("descriptor");
                taskInst = taskDesc.getInstance();
                properties = taskInst.get("properties");
                if (parseInt(properties.completeness) < 100) {
                    taskDesc.timeSolde = this.timeSolde(taskDesc);
                    taskDesc.startPlannif = this.startPlannif(taskDesc);

                    this.taskTable[taskDesc.get("id")] = taskDesc;
                }
            }
        },
        findCell: function() {
            var taskId, taskDesc, host = this.get("host"),
                dt = this.get("host").datatable, i, ii, cell;

            for (i = 0; i < dt.data.size(); i++) {
                for (taskId in this.taskTable) {
                    taskDesc = this.taskTable[taskId];
                    if (dt.getRecord(i).get("id") === taskDesc.get("id")) {
                        var iMax = parseInt(taskDesc.end);
                        for (ii = parseInt(taskDesc.startMax); ii <= iMax; ii++) {
                            cell = host.schedule.getCell(i, ii);
                            if (cell) {
                                this.findCssClass(ii, taskDesc.startMax, taskDesc.end, cell);
                            }
                        }
                        break;
                    }
                }
            }
        },
        findCssClass: function(time, start, end, cell) {
            var decimal;
            if (time < this.get("host").schedule.currentPeriod()) {
                return;
            }
            if (start - parseInt(start) === 0 && end - parseInt(end) === 0) {
                end--;
            }
            if (time === parseInt(end) || time === parseInt(start) && parseInt(start) === parseInt(end)) {
                decimal = end - parseInt(end);
                if (decimal === 0) {
                    this.addColor(cell, "fill100");
                } else if (decimal > 0 && decimal <= 0.3) {
                    this.addColor(cell, "fill0to25");
                } else if (decimal > 0.6 && decimal <= 0.99999) {
                    this.addColor(cell, "fill0to75");
                } else {
                    this.addColor(cell, "fill0to50");
                }
            } else if (time === parseInt(start)) {
                decimal = start - parseInt(start);
                if (decimal === 0) {
                    this.addColor(cell, "fill100");
                } else if (decimal > 0 && decimal <= 0.3) {
                    this.addColor(cell, "fill25to100");
                } else if (decimal > 0.6 && decimal <= 0.99999) {
                    this.addColor(cell, "fill75to100");
                } else {
                    this.addColor(cell, "fill50to100");
                }
            } else if (time > parseInt(start) && time < parseInt(end)) {
                this.addColor(cell, "fill100");
            }
        },
        addColor: function(cell, cssClass) {
            cell.append("<span class='progress " + cssClass + "'></span>");
        }
    }, {
        NS: "plannificationprogresscolor",
        NAME: "PlannificationProgressColor"
    });
    Y.Plugin.PlannificationProgressColor = PlannificationProgressColor;
});
