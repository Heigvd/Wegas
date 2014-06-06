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
YUI.add('wegas-pmg-plannificationactivitycolor', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, PlannificationActivityColor;

    /**
     *  @class color plannification in datatable
     *  @name Y.Plugin.Plannificationcolor
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    PlannificationActivityColor = Y.Base.create("wegas-pmg-plannificationactivitycolor", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Plannificationcolor */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.onceAfterHostEvent("render", function() {
                this.findCell();
                this.afterHostMethod("syncUI", this.findCell);
                this.get("host").datatable.after("sort", this.findCell, this);
            }, this);
        },
        findCell: function() {
            Y.log("sync()", "log", "Wegas.PlannificationActivityColor");
            var i, ii, host = this.get("host"), dt = host.datatable,
                    taskActivities = this.taskActivitiesToAdd();

            for (i = 0; i < dt.data.size(); i++) {
                for (ii = 0; ii < taskActivities.length; ii++) {
                    if (taskActivities[ii].get("taskDescriptorId") === dt.getRecord(i).get("id")) {
                        this.addColor(host.schedule.getCell(i, parseInt(taskActivities[ii].get("time"))));
                    }
                }
            }
        },
        findTaskActivities: function() {
            var employees, resourDesc = Wegas.Facade.VariableDescriptor.cache.find("name", "employees"),
                    i, ii, iii, taskIndex, work, activities, dt = this.get("host").datatable,
                    taskActivities = [];
            if (!resourDesc) {
                return;
            } else {
                employees = resourDesc.get("items");
            }

            for (i = 0; i < employees.length; i++) {
                work = employees[i].get("items");
                for (ii = 0; ii < work.length; ii++) {
                    activities = work[ii].getInstance().get("activities");
                    for (iii = 0; iii < activities.length; iii++) {
                        for (taskIndex = 0; taskIndex < dt.data.size(); taskIndex++) {
                            if (dt.data.item(taskIndex).get("id") === activities[iii].get("taskDescriptorId")) {
                                taskActivities.push(activities[iii]);
                            }
                        }
                    }
                }

            }
            return taskActivities;
        },
        taskActivitiesToAdd: function() {
            var taskActivities = this.findTaskActivities(), activitiesToAdd = [],
                    i, ii, exist;
            if (!taskActivities) {
                this.get("host").showMessage("error", "No employees list found");
                return;
            }
            for (i = 0; i < taskActivities.length; i++) {
                exist = false;
                if (activitiesToAdd.length === 0) {
                    activitiesToAdd.push(taskActivities[i]);
                } else {
                    for (ii = 0; ii < activitiesToAdd.length; ii++) {
                        if (activitiesToAdd[ii].get("taskDescriptorId") === taskActivities[i].get("taskDescriptorId") &&
                                activitiesToAdd[ii].get("time") === taskActivities[i].get("time")) {
                            exist = true;
                        }
                    }
                    if (!exist) {
                        activitiesToAdd.push(taskActivities[i]);
                    }
                }
            }
            return activitiesToAdd;
        },
        addColor: function(cell) {
            cell.append("<span class='editable activity'></span>");
        }
    }, {
        NS: "plannificationactivitycolor",
        NAME: "PlannificationActivityColor"
    });
    Y.Plugin.PlannificationActivityColor = PlannificationActivityColor;
});
