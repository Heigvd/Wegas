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
YUI.add('wegas-pmg-plannificationprogresscolor', function(Y) {
    "use strict";

    var PlannificationProgressColor;

    /**
     *  @class color plannification progress in datatable
     *  @name Y.Plugin.PlannificationProgressColor
     *  @extends Y.Plugin.AbstractPert
     *  @constructor
     */
    PlannificationProgressColor = Y.Base.create("wegas-pmg-plannificationprogresscolor", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
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
            Y.Wegas.PMGHelper.computePert(this.taskTable, this.get("host").schedule.currentPeriod(), this.get("host").schedule.currentPhase());
            this.renderCells();
        },
        fillTaskTable: function() {
            var i, taskDesc, taskInst, properties,
                dt = this.get("host").datatable;

            for (i = 0; i < dt.data.size(); i += 1) {
                taskDesc = dt.getRecord(i).get("descriptor");
                taskInst = taskDesc.getInstance();
                properties = taskInst.get("properties");
                if (parseInt(properties.completeness, 10) < 100) {
                    taskDesc.timeSolde = taskInst.getRemainingTime();
                    taskDesc.startPlannif = taskInst.getFirstPlannedPeriod();
                    taskDesc.beginAt = undefined;
                    taskDesc.endAt = undefined;
                    taskDesc.planned= [];

                    this.taskTable[taskDesc.get("id")] = taskDesc;
                }
            }
        },
        renderCells: function() {
            var taskId, taskDesc, host = this.get("host"),
                dt = this.get("host").datatable, i, ii, cell;

            for (i = 0; i < dt.data.size(); i += 1) {
                for (taskId in this.taskTable) {
                    taskDesc = this.taskTable[taskId];
                    if (dt.getRecord(i).get("id") === taskDesc.get("id")) {
                        for (ii in taskDesc.planned) {
                            cell = host.schedule.getCell(i, taskDesc.planned[ii]);
                            if (cell) {
                                this.findCssClass(taskDesc.planned[ii], taskDesc.beginAt, taskDesc.endAt, cell);
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
            if (start - parseInt(start, 10) === 0 && end - parseInt(end, 10) === 0) {
                end -= 1;
            }
            if ((time === parseInt(end, 10)) || ((time === parseInt(start, 10)) && (parseInt(start, 10) === parseInt(end, 10)))) {
                decimal = end - parseInt(end, 10);
                if (decimal === 0) {
                    this.addColor(cell, "fill100");
                } else if (decimal > 0 && decimal <= 0.3) {
                    this.addColor(cell, "fill0to25");
                } else if (decimal > 0.6 && decimal <= 0.99999) {
                    this.addColor(cell, "fill0to75");
                } else {
                    this.addColor(cell, "fill0to50");
                }
            } else if (time === parseInt(start, 10)) {
                decimal = start - parseInt(start, 10);
                if (decimal === 0) {
                    this.addColor(cell, "fill100");
                } else if (decimal > 0 && decimal <= 0.3) {
                    this.addColor(cell, "fill25to100");
                } else if (decimal > 0.6 && decimal <= 0.99999) {
                    this.addColor(cell, "fill75to100");
                } else {
                    this.addColor(cell, "fill50to100");
                }
            } else if (time > parseInt(start, 10) && time < parseInt(end, 10)) {
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
