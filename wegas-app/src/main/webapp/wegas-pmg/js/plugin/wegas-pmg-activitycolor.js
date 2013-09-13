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

        findCell: function() {
            var i, ii, iii, vd, dt = this.get("host").datatable,
                    abstractAssignement;

            for (i = 0; i < dt.data._items.length; i++) {
                vd = Y.Wegas.Facade.VariableDescriptor.cache.find("id", dt.data._items[i].get("id"));
                abstractAssignement = vd.getInstance().get("activities");
                for (ii = 0; ii < abstractAssignement.length; ii++) {
                    for (iii = 0; iii < dt.get('columns').length; iii++) {
                        if (dt.get('columns')[iii].time === parseInt(abstractAssignement[ii].get("time")) && dt.get('columns')[iii].time < this.get("host").scheduleDT.currentPeriod()) { //Affiche les occupations
                            this.addColor(dt.getRow(i).getDOMNode().cells[iii], abstractAssignement[ii].get("editable") === null ? "true" : abstractAssignement[ii].get("editable"));
                        }
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
