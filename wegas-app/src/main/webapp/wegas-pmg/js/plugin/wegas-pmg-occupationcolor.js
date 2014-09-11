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
    var OccupationColor = Y.Base.create("wegas-pmg-occupationcolor", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
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

            for (i = 0; i < data.size(); i++) {
                occupations = data.item(i).get("descriptor").getInstance().get("occupations");
                for (ii = 0; ii < occupations.length; ii++) {
                    time = occupations[ii].get("time");
                    if (time >= host.schedule.currentPeriod()
                        || !occupations[ii].get("editable")) {                  //Affiche les occupations
                        if (host.schedule.getCell(i, time)) {
                            this.addColor(host.schedule.getCell(i, time), occupations[ii].get("editable"));
                        }
                    }
                }
            }
        },
        addColor: function(cell, editable) {
            if (editable) {
                if (!this.get("autoReservation")) {
                    cell.setContent("<span class='editable'></span>");
                }
            } else {
                cell.addClass("noteditable-period");
                cell.setContent("<span class='notEditable'></span>");
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

    var EngagmentDelay = Y.Base.create("wegas-pmg-engagementdelay", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
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
                currentPeriod = host.schedule.currentPeriod();

            for (i = 0; i < dt.data.size(); i++) {
                for (ii = 0; ii < dt.data.item(i).get("properties.engagementDelay"); ii++) {
                    cell = host.schedule.getCell(i, currentPeriod + ii);
                    if (cell) {
                        if (!cell.getContent()) {
                            cell.setContent("<span class='engagementDelay'></span>");
                        }
                        cell.getDOMNode().className = "yui3-datatable-col-2 schedulecolumn delay yui3-datatable-cell";
                    }
                }
            }
        }
    }, {
        NS: "EngagmentDelay"
    });
    Y.Plugin.EngagmentDelay = EngagmentDelay;
});
