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
            this.onceAfterHostEvent("render", this.findCell);
            this.afterHostMethod("syncUI", this.findCell);
            this._handles.push(this.get("host").datatable.after("sort", this.findCell, this));
        },
        sync: function() {
            Y.log("sync()", "info", "Wegas.OccupationColor");
            var i, ii, iii, vd, dt = this.get("host").datatable,
                    abstractAssignement;

            this.addEngagementDelay();

            for (i = 0; i < dt.data._items.length; i++) {
                vd = Wegas.Facade.VariableDescriptor.cache.find("id", dt.data._items[i].get("id"));
                abstractAssignement = vd.getInstance().get("occupations");
                for (ii = 0; ii < abstractAssignement.length; ii++) {
                    for (iii = 0; iii < dt.get('columns').length; iii++) {
                        if (dt.get('columns')[iii].time === abstractAssignement[ii].get("time") && dt.get('columns')[iii].time >= this.get("host").scheduleDT.currentPeriod()) { //Affiche les occupations
                            this.addColor(dt.getRow(i).getDOMNode().cells[iii], abstractAssignement[ii].get("editable"));
                        } else if (dt.get('columns')[iii].time === abstractAssignement[ii].get("time") && !abstractAssignement[ii].get("editable")) {
                            this.addColor(dt.getRow(i).getDOMNode().cells[iii], abstractAssignement[ii].get("editable"));
                        }
                    }
                }
            }
        },
        addColor: function(cell, editable) {
            if (editable) {
                cell.innerHTML = "<span class='editable'></span>";
            } else {
                cell.innerHTML = "<span class='notEditable'></span>";
            }
        },
        addEngagementDelay: function() {
            var dt = this.get("host").datatable;
            for (var i = 0; i < dt.data._items.length; i++) {
                if (dt.data._items[i].get("properties").engagementDelay !== 0) {
                    for (var iii = 0; iii < dt.get('columns').length; iii++) {
                        for (var iiii = 0; iiii < dt.data._items[i].get("properties").engagementDelay; iiii++) {
                            if (this.get("host").scheduleDT.currentPeriod() === dt.get('columns')[iii].time) {
                                dt.getRow(i).getDOMNode().cells[iii + iiii].innerHTML = "<span class='engagementDelay'></span>";
                                dt.getRow(i).getDOMNode().cells[iii + iiii].className = "yui3-datatable-col-2 schedulColumn delay yui3-datatable-cell";
                            }
                        }
                    }
                }
            }
        }
    }, {
        NS: "occupationcolor",
        NAME: "OccupationColor"
    });
    Y.namespace("Plugin").OccupationColor = OccupationColor;
});
