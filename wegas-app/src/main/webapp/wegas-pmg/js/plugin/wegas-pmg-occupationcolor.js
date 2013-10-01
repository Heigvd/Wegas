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
YUI.add('wegas-pmg-occupationcolor', function(Y) {
    "use strict";

    /**
     *  @class color occupation in datatable
     *  @name Y.Plugin.OccupationColor
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
            OccupationColor = Y.Base.create("wegas-pmg-occupationcolor", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.OccupationColor */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            Y.log("initializer", "info", "Wegas.OccupationColor");
            this.onceAfterHostEvent("render", function() {
                this.sync();
                this.afterHostMethod("syncUI", this.sync);
            });
            this.get("host").datatable.after("sort", this.sync, this);
        },
        sync: function() {
            Y.log("sync()", "info", "Wegas.OccupationColor");
            var i, ii, time,
                    host = this.get("host"),
                    dt = host.datatable,
                    abstractAssignement;

            this.addEngagementDelay();

            for (i = 0; i < dt.data.size(); i++) {
                abstractAssignement = dt.data.item(i).get("descriptor").getInstance().get("occupations");
                for (ii = 0; ii < abstractAssignement.length; ii++) {
                    time = abstractAssignement[ii].get("time");
                    if (time >= host.schedule.currentPeriod()
                            || !abstractAssignement[ii].get("editable")) {      //Affiche les occupations
                        this.addColor(host.schedule.getCell(i, time), abstractAssignement[ii].get("editable"));
                    }
                }
            }
        },
        addColor: function(cell, editable) {
            if (editable) {
                cell.setContent("<span class='editable'></span>");
            } else {
                cell.setContent("<span class='notEditable'></span>");
            }
        },
        addEngagementDelay: function() {
            var i, ii, cell, host = this.get("host"),
                    dt = host.datatable,
                    currentPeriod = host.schedule.currentPeriod();
            for (i = 0; i < dt.data.size(); i++) {
                for (ii = 0; ii < dt.data.item(i).get("properties.engagementDelay"); ii++) {
                    cell = host.schedule.getCell(i, currentPeriod + ii);
                    cell.setContent("<span class='engagementDelay'></span>");
                    cell.getDOMNode().className = "yui3-datatable-col-2 schedulecolumn delay yui3-datatable-cell";
                }
            }
        }
    }, {
        NS: "occupationcolor",
        NAME: "OccupationColor"
    });
    Y.namespace("Plugin").OccupationColor = OccupationColor;
});
