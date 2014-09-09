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
YUI.add('wegas-pmg-reservation', function(Y) {
    "use strict";

    /**
     *  @class save or delete reservation
     *  @name Y.Plugin.Reservation
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas, Reservation;

    Reservation = Y.Base.create("wegas-pmg-reservation", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Reservation */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.onceAfterHostEvent("render", function() {
                var host = this.get("host");
                host.datatable.delegate("click", this.onClick, ".present, .futur", this);
                host.get("contentBox").addClass("wegas-pmg-reservation");
            });
        },
        onClick: function(e) {
            var dt = this.get("host").datatable,
                cell = dt.getCell(e.currentTarget),
                time = dt.getColumn(e.currentTarget).time,
                resource = dt.getRecord(e.currentTarget).get("descriptor").getInstance(),
                assignment = Y.Array.find(resource.get("occupations"), function(o) {
                    return o.get("time") === time;
                });

            if (assignment || cell.one("span")) {                               // if the cell is full and there is no assignment, it means we are still waiting for server reply
                if (assignment && assignment.get("editable")) {
                    cell.setContent("");
                    Wegas.Facade.Variable.sendQueuedRequest({
                        request: "/ResourceDescriptor/AbstractRemove/" + assignment.get("id") + "/occupations",
                        cfg: {
                            method: "DELETE",
                            updateEvent: false
                        }
                    });
                }
                return;
            }

            cell.append('<span class="editable"></span>');
            Wegas.Facade.Variable.sendQueuedRequest({
                request: "/ResourceDescriptor/AbstractAssign/" + resource.get("id"),
                cfg: {
                    method: "POST",
                    updateEvent: false,
                    data: {
                        "@class": "Occupation",
                        editable: true,
                        time: time
                    }
                }
            });
        }
    }, {
        NS: "reservation"
    });
    Y.Plugin.Reservation = Reservation;
});
