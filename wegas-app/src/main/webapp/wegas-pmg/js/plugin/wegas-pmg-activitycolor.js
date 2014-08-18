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
YUI.add('wegas-pmg-activitycolor', function(Y) {
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
            this.afterHostMethod("syncUI", this.sync);
            this.get("host").datatable.after("sort", this.sync, this);
        },
        sync: function() {
            var i, time,
                host = this.get("host"),
                currentPeriod = host.schedule.currentPeriod(),
                data = host.datatable.data;

            for (i = 0; i < data.size(); i++) {
                Y.Array.each(data.item(i).get("descriptor").getInstance().get("activities"), function(a) {
                    time = parseInt(a.get("time"));
                    if (time < currentPeriod) {
                        host.schedule.getCell(i, time).setContent("<span class='editable'></span>");
                    }
                });
            }
        }
    }, {
        NS: "activitycolor",
        NAME: "ActivityColor"
    });
    Y.Plugin.ActivityColor = ActivityColor;
});
