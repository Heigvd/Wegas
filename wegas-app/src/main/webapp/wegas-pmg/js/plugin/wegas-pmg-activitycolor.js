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
    var Wegas = Y.Wegas,
            ActivityColor = Y.Base.create("wegas-pmg-activitycolor", Y.Plugin.OccupationColor, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.ActivityColor */

        sync: function() {
            var i, ii, time, abstractAssignement,
                    host = this.get("host"),
                    currentPeriod = host.schedule.currentPeriod(),
                    dt = host.datatable;

            for (i = 0; i < dt.data.size(); i++) {
                abstractAssignement = dt.data.item(i).get("descriptor").getInstance().get("activities");
                for (ii = 0; ii < abstractAssignement.length; ii++) {
                    time = parseInt(abstractAssignement[ii].get("time"));
                    if (time < currentPeriod) {
                        this.addColor(host.schedule.getCell(i, time),
                                abstractAssignement[ii].get("editable") === null ? "true" : abstractAssignement[ii].get("editable"));

                    }
                }
            }
        }
    }, {
        NS: "activitycolor",
        NAME: "ActivityColor"
    });
    Y.namespace("Plugin").ActivityColor = ActivityColor;
});
