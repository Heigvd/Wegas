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
            var employees, i, ii, activities,
                employees = Wegas.Facade.Variable.cache.find("name", "employees"),
                data = this.get("host").datatable.data,
                taskActivities = [];

            if (!employees) {
                return;
            }

            Y.Array.each(employees.flatten(), function(e) {
                activities = e.getInstance().get("activities");
                for (i = 0; i < activities.length; i++) {
                    for (ii = 0; ii < data.size(); ii++) {
                        if (data.item(ii).get("id") === activities[i].get("taskDescriptorId")) {
                            taskActivities.push(activities[i]);
                        }
                    }
                }
            });
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
                            parseInt(activitiesToAdd[ii].get("time")) === parseInt(taskActivities[i].get("time"))) {
                            exist = true;
                            break;
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
        NS: "plannificationactivitycolor"
    });
    Y.Plugin.PlannificationActivityColor = PlannificationActivityColor;
});
