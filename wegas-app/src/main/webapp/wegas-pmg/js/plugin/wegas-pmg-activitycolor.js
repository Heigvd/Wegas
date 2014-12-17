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
/*global YUI*/
YUI.add("wegas-pmg-activitycolor", function(Y) {
    "use strict";

    /**
     *  @class color occupation in datatable
     *  @name Y.Plugin.ActivityColor
     *  @extends Y.Plugin.OccupationColor
     *  @constructor
     */
    var ActivityColor = Y.Base.create("wegas-pmg-activitycolor", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /** @lends Y.Plugin.ActivityColor */
        initializer: function() {
            Y.log("initializer", "info", "Wegas.OccupationColor");
            this.onceAfterHostEvent("render", function() {
                this.sync();
                this.afterHostMethod("syncUI", this.sync);
                this.get("host").datatable.after("sort", this.sync, this);
            });
        },
        getActivitiesByPeriod: function(resourceInstance) {
            var activities = {},
                periodNumber,
                taskNumber;

            Y.Array.each(resourceInstance.get("activities"), function(a) {
                periodNumber = parseInt(a.get("time"), 10);
                taskNumber = Y.Wegas.Facade.Variable.cache.findById(a.get("taskDescriptorId")).get("index");
                if (activities[periodNumber]) {
                    activities[periodNumber] += "; " + taskNumber;
                } else {
                    activities[periodNumber] = taskNumber;
                }
            }, this);

            return activities;
        },
        sync: function() {
            var time, host = this.get("host"),
                currentPeriod = host.schedule.currentPeriod(),
                activities, occupations;

            host.datatable.data.each(function(i, index) {
                activities = this.getActivitiesByPeriod(i.get("descriptor").getInstance());
                occupations = i.get("descriptor").getInstance().get("occupations");
                for (time in activities){
                    if (time < currentPeriod){
                        host.schedule.getCell(index, +time).setContent("<span class='editable'>"
                            + activities[time]
                            + "</span>");
                    }
                }
                // detect past editable occupation without associated activities
                Y.Array.each(occupations, function (o){
                    time = o.get("time");
                    if (o.get("editable") && time < currentPeriod && !activities[time]){
                        host.schedule.getCell(index, +time).setContent("<span class='editable'></span>");
                    }
                }
                , this);
            }, this);
        }
    }, {
        NS: "activitycolor"
    });
    Y.Plugin.ActivityColor = ActivityColor;
});
