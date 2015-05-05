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
YUI.add('wegas-pmg-occupationcolor', function(Y) {
    "use strict";

    var OccupationColor, EngagmentDelay;

    /**
     *  @class color occupation in datatable
     *  @name Y.Plugin.OccupationColor
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    OccupationColor = Y.Base.create("wegas-pmg-occupationcolor", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /** @lends Y.Plugin.OccupationColor */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            //Y.log("initializer", "info", "Wegas.OccupationColor");
            this.onceAfterHostEvent("render", function() {
                this.sync();
                this.afterHostMethod("syncUI", this.sync);
                this.get("host").datatable.after("sort", this.sync, this);
            });
        },
        sync: function() {
            //Y.log("sync()", "info", "Wegas.OccupationColor");
            var i, ii, time, occupations,
                host = this.get("host"),
                data = host.datatable.data;

            for (i = 0; i < data.size(); i += 1) {
                occupations = data.item(i).get("descriptor").getInstance().get("occupations");
                for (ii = 0; ii < occupations.length; ii += 1) {
                    time = occupations[ii].get("time");
                    if (time > 0) {
                        if (time >= host.schedule.currentPeriod()
                            || !occupations[ii].get("editable")) {                  //Affiche les occupations
                            if (host.schedule.getCell(i, time)) {
                                this.addColor(host.schedule.getCell(i, time), occupations[ii].get("editable"));
                            }
                        }
                    }
                }
            }
        },
        addColor: function(cell, editable) {
            if (editable) {
                if (!this.get("autoReservation")) {
                    cell.setContent("<span class='booked'></span>");
                }
            } else {
                cell.addClass("noteditable-period");
                cell.setContent("<span class='unavailable'></span>");
            }
        }
    }, {
        ATTRS: {
            autoReservation: {
                type: "boolean",
                value: false,
                _inputex: {
                    label: "Automated reservation"
                }
            }
        },
        NS: "occupationcolor"
    });
    Y.Plugin.OccupationColor = OccupationColor;

    EngagmentDelay = Y.Base.create("wegas-pmg-engagementdelay", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /** @lends Y.Plugin.OccupationColor */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.onceAfterHostEvent("render", function() {
                this.sync();
                this.afterHostMethod("syncUI", this.sync);
                this.get("host").datatable.after("sort", this.sync, this);
            });
        },
        sync: function() {
            var i, ii, cell, host = this.get("host"),
                dt = host.datatable,
                currentPeriod = host.schedule.currentPeriod(),
                initialMaximum = host.schedule.initialMaximum(),
                period;

            for (i = 0; i < dt.data.size(); i += 1) {
                for (ii = 0; ii < dt.data.item(i).get("properties.engagementDelay"); ii += 1) {
                    period = currentPeriod + ii;
                    // Issue #795: disable engagment delay when currentPeriod > initial maximum
                    if (period <= initialMaximum) {
                        cell = host.schedule.getCell(i, currentPeriod + ii);
                        if (cell) {
                            if (!cell.getContent()) {
                                cell.setContent("<span class='engagementDelay'></span>");
                            }
                            cell.getDOMNode().className = "yui3-datatable-col-2 schedulecolumn delay yui3-datatable-cell";
                        }
                    } else {
                        break;
                    }
                }
            }
        }
    }, {
        NS: "EngagmentDelay"
    });
    Y.Plugin.EngagmentDelay = EngagmentDelay;
});
