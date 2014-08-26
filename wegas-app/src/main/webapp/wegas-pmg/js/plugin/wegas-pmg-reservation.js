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
            this.get("host").datatable.delegate("click", this.onClick, ".present, .futur", this);
            this.onceAfterHostEvent("render", function() {
                this.get("host").get("contentBox").addClass("wegas-pmg-reservation");
            });
        },
        onClick: function(e) {
            var i, assignment,
                dt = this.get("host").datatable,
                cell = dt.getCell(e.currentTarget),
                time = dt.getColumn(e.currentTarget).time,
                resource = dt.getRecord(e.currentTarget).get("descriptor").getInstance();

            for (i = 0; i < resource.get("occupations").length; i++) {
                assignment = resource.get("occupations")[i];
                if (assignment.get("time") === time) {
                    if (assignment.get("editable")) {                           // this does not make sense if we use the widget with activities
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
