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
        sync: function(){
            this.get("host").fire("softsync");
        },
        onClick: function(e) {
            var dt = this.get("host").datatable,
                cell = dt.getCell(e.currentTarget),
                time = dt.getColumn(e.currentTarget).time,
                resource = dt.getRecord(e.currentTarget).get("descriptor").getInstance(),
                occupation = Y.Array.find(resource.get("occupations"), function(o) {
                    return o.get("time") === time && o.get("editable");
                });


            if (Y.Array.find(resource.get("occupations"), function(o) {
                return o.get("time") === time && !o.get("editable");
            })) {
                // Cannot edit uneditable...
                return;
            }

            if (occupation) {
                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    Wegas.Facade.Variable.sendRequest({
                        request: "/ResourceDescriptor/AbstractRemove/" + occupation.get("id") + "/occupations",
                        cfg: {
                            method: "DELETE",
                            updateEvent: false
                        },
                        on: {
                            success: Y.bind(function() {
                                cell.setContent("");
                                this.sync();
                            }, this)
                        }
                    });
                }, this));
            } else {
                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    Wegas.Facade.Variable.sendRequest({
                        request: "/ResourceDescriptor/AbstractAssign/" + resource.get("id"),
                        cfg: {
                            method: "POST",
                            updateEvent: false,
                            data: {
                                "@class": "Occupation",
                                editable: true,
                                time: time
                            }},
                        on: {
                            success: Y.bind(function() {
                                cell.append('<span class="booked"></span>');
                                this.sync();
                            }, this)
                        }
                    });
                }, this));
            }
        }
    }, {
        NS: "reservation"
    });
    Y.Plugin.Reservation = Reservation;
});
