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
    var Wegas = Y.Wegas,
            Reservation = Y.Base.create("wegas-pmg-reservation", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Reservation */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            var dt, id, columnsCfg;

            this.get("host").onceAfter("render", function() {
                this.get("host").datatable.delegate("click", function(e, a) {
                    dt = this.get("host").datatable;
                    id = dt.getRecord(e.target).get("id");
                    columnsCfg = dt.get('columns')[dt.getCell(e.target).get("cellIndex")];

                    this.checkCache(id, columnsCfg.time);
                }, "tbody .present, tbody .futur", this);
            }, this);
        },
        checkCache: function(descriptorId, periode) {
            var vd = Y.Wegas.Facade.VariableDescriptor.cache.find("id", descriptorId),
                    i, abstractAssignement, type = this.get("type"), data;

            for (i = 0; i < vd.getInstance().get(type).length; i++) {
                abstractAssignement = vd.getInstance().get(type)[i];
                if (abstractAssignement.get("time") === periode && abstractAssignement.get("editable")) {
                    this.remove(abstractAssignement.get("id"), type);
                    return;
                } else if (abstractAssignement.get("time") === periode) {
                    return;
                }
            }

            if (type === "occupations") {
                data = this.dataOccupation(periode);
            } else {
                data = this.dataActivity(periode);
            }

            this.add(vd.getInstance().get("id"), data);
        },
        dataOccupation: function(periode) {
            return {
                "@class": "Occupation",
                editable: true,
                time: periode
            };
        },
        dataActivity: function(periode) {
            return {
                "@class": "Activity",
                editable: true,
                time: periode
            };
        },
        add: function(ressourceId, data) {
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ResourceDescriptor/AbstractAssign/" + ressourceId,
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify(data)
                }
            });
        },
        remove: function(abstractAssignementId, type) {
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ResourceDescriptor/AbstractRemove/" + abstractAssignementId + "/" + type,
                cfg: {
                    method: "DELETE"
                }
            });
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
        }
    }, {
        ATTRS: {
            type: {
                value: "occupations",
                _inputex: {
                    _type: "select",
                    label: "Type",
                    value: "occupations",
                    choices: [{value: 'occupations'}, {value: 'activities'}]
                }
            }
        },
        NS: "reservation",
        NAME: "Reservation"
    });
    Y.namespace("Plugin").Reservation = Reservation;
});
