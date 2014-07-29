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
     *  @extends Y.Plugin.PlannificationActivityColor
     *  @constructor
     */
    PlannificationProgressColor = Y.Base.create("wegas-pmg-plannificationprogresscolor", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.PlannificationProgressColor */
        initializer: function() {
            //this.taskTable;
            this.onceAfterHostEvent("render", function() {
                this.sync();

                this.afterHostMethod("syncUI", this.sync);

                this.get("host").datatable.after("sort", this.sync, this);
            });
        },
        sync: function() {
            this.taskTable = {};
            this.fillTaskTable();
            this.pertValue();
            this.findCell();
        },
        fillTaskTable: function() {
            var i, taskDesc, taskInst, dt = this.get("host").datatable,
                    properties;

            for (i = 0; i < dt.data._items.length; i++) {
                taskDesc = Wegas.Facade.Variable.cache.find("id", dt.getRecord(i).get("id"));
                taskInst = taskDesc.getInstance();
                properties = taskInst.get("properties");
                if (parseInt(properties.completeness) < 100) {
                    taskDesc.timeSolde = this.timeSolde(taskDesc);
                    taskDesc.startPlannif = this.startPlannif(taskDesc);

                    this.taskTable[taskDesc.get("id")] = taskDesc;
                }
            }
        },
        timeSolde: function(taskDesc) {
            var taskInst = taskDesc.getInstance(), properties = taskInst.get("properties"), timeSolde;
            if (taskInst.get("plannification").length > 0) {
                timeSolde = (1 - parseInt(properties.completeness) / 100) * taskInst.get("plannification").length;
            } else {
                timeSolde = (1 - parseInt(properties.completeness) / 100) * taskInst.get("duration");
            }
            return timeSolde;
        },
        startPlannif: function(taskDesc) {
            var taskInst = taskDesc.getInstance(), plannification = taskInst.get("plannification"), min;
            min = Math.min.apply(Math, plannification);
            if (min !== Infinity) {
                return min;
            } else {
                return 0;
            }
        },
        pertValue: function() {
            var predecessors, taskId, taskDesc, i, maxPert, predecessorDuration,
                    allPredDefine, countPertValue = 0, treated = [], predecessorId;

            while (countPertValue < Y.Object.size(this.taskTable)) {
                for (taskId in this.taskTable) {
                    taskDesc = this.taskTable[taskId];

                    if (Y.Array.indexOf(treated, taskId) > -1) {
                        continue;
                    }

                    maxPert = this.get("host").schedule.currentPeriod();
                    allPredDefine = true;
                    predecessors = taskDesc.get("predecessors");

                    for (i = 0; i < predecessors.length; i++) {
                        predecessorId = predecessors[i].get("id");
                        if (!this.taskTable[predecessorId]) {
                            continue;
                        }
                        // verifie si le pr�decesseur possede le debut pert
                        if (this.taskTable[predecessorId].startPert) {
                            // defini la dur�e du pr�decesseur
                            predecessorDuration = this.taskTable[predecessorId].startPert + this.taskTable[predecessorId].timeSolde;
                            // verifie si la dur�e du pr�decesseur et la plus grande
                            if (predecessorDuration > maxPert) {
                                maxPert = predecessorDuration;
                            }
                        } else {
                            allPredDefine = false;
                        }
                    }
                    // si tous les pr�decesseur on un debut pert alors on l'ajoute dans la liste
                    if (allPredDefine) {
                        treated.push(taskId);
                        taskDesc.startPert = maxPert;
                        taskDesc.startMax = Math.max(taskDesc.startPert, taskDesc.startPlannif);
                        taskDesc.end = taskDesc.startMax + taskDesc.timeSolde;
                        countPertValue++;
                    }
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
                        for (ii = 1; ii <= host.schedule.get("columnToAdd"); ii++) {
                            cell = host.schedule.getCell(i, ii);
                            this.findCssClass(ii, taskDesc.startMax, taskDesc.end, cell);
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
