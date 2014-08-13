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
     *  @extends Y.Plugin.AbstractPert
     *  @constructor
     */
    AutoReservationColor = Y.Base.create("wegas-pmg-autoreservation-color", Y.Plugin.AbstractPert, [], {
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
        renderCells: function() {
            var i,
                dt = this.get("host").datatable,
                resourceDesc, resourceInst,
                assignments, assignment, aId, first,
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


                first = null;
                // foreach assigned task
                for (aId in assignments) {
                    assignment = assignments[aId];
                    taskDescId = assignment.get("taskDescriptorId");

                    // Find the task in taskTable
                    for (taskTableId in this.taskTable) {
                        taskDesc = this.taskTable[taskTableId];
                        if (aId === "0") {
                            first = taskDesc.get("index");
                        }
                        if (taskDesc.get("id") === taskDescId) {
                            var start = taskDesc.startMax,
                                end = taskDesc.end;

                            if (start - parseInt(start) === 0 && end - parseInt(end) === 0) {
                                end--;
                            }

                            for (period = start; period <= end; period++) {
                                periods.push(period);
                            }
                            break;
                        }
                    }
                }
                for (period in periods.sort()) {
                    this.addColor(HOST.schedule.getCell(i, periods[period]), (period === "0" ? first : ""));
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
