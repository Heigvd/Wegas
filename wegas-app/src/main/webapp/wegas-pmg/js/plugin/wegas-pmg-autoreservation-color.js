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
YUI.add('wegas-pmg-autoreservation-color', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, AutoReservationColor;

    /**
     *  @class occupationcolor-like for automatedReservation in datatable
     *  @name Y.Plugin.AutoReservationColor
     *  @extends Y.Plugin.AbstractPert
     *  @constructor
     */
    AutoReservationColor = Y.Base.create("wegas-pmg-autoreservation-color", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.AutoReservationColor */
        initializer: function() {
            //this.taskTable;
            this.handlers = [];

            Y.log("initializer", "info", "Wegas.AutoReservationColor");

            this.onceAfterHostEvent("render", function() {
                this.sync();

                this.afterHostMethod("syncUI", this.sync);

                this.get("host").datatable.after("sort", this.sync, this);

                this.handlers.push(this.get("host").datatable.delegate("click", this.onClick,
                    ".yui3-datatable-col-instance£properties£automaticMode",
                    this));
            });
        },
        onClick: function(e) {
            var resourceD = this.get("host").datatable.getRecord(e.target).get("descriptor");

            this.get("host").datatable.getCell(e.target).addClass("loading");

            Wegas.Facade.Variable.sendQueuedRequest({
                request: "/Script/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "Script",
                        content: "PMGHelper.toogleAutomaticMode('" + resourceD.get("name") + "');"
                    }
                }
            });

        },
        sync: function() {
            this.taskTable = {};
            this.fillTaskTable();
            Y.Wegas.PMGHelper.computePert(this.taskTable, this.get("host").schedule.currentPeriod(), this.get("host").schedule.currentPhase());
            this.get("host").get("contentBox").all(".yui3-datatable-col-instance£properties£automaticMode").addClass("automatic-mode-toogle");
            this.renderCells();
        },
        fillTaskTable: function() {
            var i, taskDesc, taskInst,
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
                if (taskInst.get("active") && parseInt(properties.completeness, 10) < 100) {
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
            var i, min, max,
                dt = this.get("host").datatable,
                resourceDesc, resourceInst,
                assignments, assignment, aId,
                taskDescId, taskTableId,
                taskDesc,
                periods, period,
                HOST = this.get("host"),
                p;


            // For earch resource instance
            for (i = 0; i < dt.data.size(); i += 1) {
                resourceDesc = Wegas.Facade.Variable.cache.find("id", dt.getRecord(i).get("id"));
                resourceInst = resourceDesc.getInstance();
                periods = [];
                assignments = resourceInst.get("assignments");
                if (resourceInst.get("properties.automaticMode") === "ASAP") {
                    if (assignments.length > 0) {
                        max = HOST.schedule.getNumberOfColumn();
                        if (Y.Wegas.PMGHelper.getCurrentPhaseNumber() === 3) {
                            min = Y.Wegas.PMGHelper.getCurrentPeriodNumber();
                        } else if (Y.Wegas.PMGHelper.getCurrentPhaseNumber() < 3) {
                            min = 1;
                        } else {
                            min = max;
                        }
                        for (period = min; period <= max; period += 1) {
                            this.addColor(HOST.schedule.getCell(i, period), "maybe");
                        }
                    }
                } else {
                    // foreach assigned task
                    for (aId in assignments) {
                        assignment = assignments[aId];
                        taskDescId = assignment.get("taskDescriptorId");

                        // Find the task in taskTable
                        for (taskTableId in this.taskTable) {
                            taskDesc = this.taskTable[taskTableId];
                            if (taskDesc.get("id") === taskDescId) {
                                for (p in taskDesc.planned) {
                                    periods.push(taskDesc.planned[p]);
                                }
                                break;
                            }
                        }
                    }
                    for (period in periods) {
                        this.addColor(HOST.schedule.getCell(i, periods[period]));
                    }
                }
            }
        },
        addColor: function(cell, klass) {
            klass = klass || "booked";
            // Do not add a span if one already exists. This may occurs when:
            //   1) several assigned tasks are "planned" at the same time
            //   2) An uneditable occupation has been added previously
            if (cell && !cell.hasChildNodes()) {
                cell.append("<span class='" + klass + "'></span>");
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
