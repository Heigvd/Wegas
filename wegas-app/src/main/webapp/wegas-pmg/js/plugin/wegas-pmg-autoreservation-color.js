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
YUI.add('wegas-pmg-autoreservation-color', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, AutoReservationColor;

    /**
     *  @class occupationcolor-like for automatedReservation in datatable
     *  @name Y.Plugin.AutoReservationColor
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    AutoReservationColor = Y.Base.create("wegas-pmg-autoreservation-color", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.AutoReservationColor */
        initializer: function() {
            //this.taskTable;

            Y.log("initializer", "info", "Wegas.AutoReservationColor");

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
            this.renderCells();
        },
        fillTaskTable: function() {
            var i, taskDesc, taskInst, dt = this.get("host").datatable,
                properties, tasks, items;

            if (!this.get("taskList")) {
                return;
            }
            tasks = Y.Wegas.Facade.Variable.cache.find("name", this.get("taskList"));
            items = tasks.get('items');
            for (i = 0; i < items.length; i += 1) {
                taskDesc = Wegas.Facade.Variable.cache.find("id", items[i].get("id"));
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
        computePert: function(taskTable, currentPeriod) {
            var predecessors, taskId, taskDesc, i, maxPert, predecessorDuration,
                allPredDefine, countPertValue = 0, treated = [], predecessorId;

            while (countPertValue < Y.Object.size(taskTable)) {
                for (taskId in taskTable) {
                    taskDesc = taskTable[taskId];

                    if (Y.Array.indexOf(treated, taskId) > -1) {
                        continue;
                    }

                    maxPert = currentPeriod;
                    allPredDefine = true;
                    predecessors = taskDesc.get("predecessors");

                    for (i = 0; i < predecessors.length; i++) {
                        predecessorId = predecessors[i].get("id");
                        if (!taskTable[predecessorId]) {
                            continue;
                        }
                        // verifie si le prédecesseur possede le debut pert
                        if (taskTable[predecessorId].startPert) {
                            // defini la durée du prédecesseur
                            predecessorDuration = taskTable[predecessorId].startPert + taskTable[predecessorId].timeSolde;
                            // verifie si la durée du prédecesseur et la plus grande
                            if (predecessorDuration > maxPert) {
                                maxPert = predecessorDuration;
                            }
                        } else {
                            allPredDefine = false;
                        }
                    }
                    // si tous les prédecesseur on un debut pert alors on l'ajoute dans la liste
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
        renderCells: function() {
            var i,
                dt = this.get("host").datatable,
                resourceDesc, resourceInst,
                assignments, assignment, aId,
                taskDescId, taskTableId,
                taskDesc,
                periods, period,
                HOST = this.get("host");


            // For earch resource instance
            for (i = 0; i < dt.data.size(); i++) {
                resourceDesc = Wegas.Facade.Variable.cache.find("id", dt.getRecord(i).get("id"));
                resourceInst = resourceDesc.getInstance();
                assignments = resourceInst.get("assignments");
                periods = [];

                // foreach assigned task
                for (aId in assignments) {
                    assignment = assignments[aId];
                    taskDescId = assignment.get("taskDescriptorId");

                    // Find the task in taskTable
                    for (taskTableId in this.taskTable) {
                        taskDesc = this.taskTable[taskTableId];
                        if (taskDesc.get("id") === taskDescId) {
                            var max = parseInt(taskDesc.end), j;
                            for (period = parseInt(taskDesc.startMax); period <= max; period++) {
                                periods.push(period);
                            }
                            break;
                        }
                    }
                }
                for (period in periods) {
                    this.addColor(HOST.schedule.getCell(i, periods[period]));
                }
            }
        },
        addColor: function(cell, text) {
            // Do not add a span if one already exists. This may occurs when:
            //   1) several assigned tasks are "planned" at the same time
            //   2) An uneditable occupation has been added previously
            if (cell && !cell.hasChildNodes()) {
                cell.append("<span class='editable'>" + (text ? text : "") + "</span>");
            }
        }
    }, {
        NS: "autoreservation-color",
        NAME: "autoreservation-color",
        ATTRS: {
            taskList: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Task list"
                }
            }
        }
    });
    Y.Plugin.AutoReservationColor = AutoReservationColor;
});
