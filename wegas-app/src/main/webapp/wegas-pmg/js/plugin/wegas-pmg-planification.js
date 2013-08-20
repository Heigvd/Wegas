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
YUI.add('wegas-pmg-planification', function(Y) {
    "use strict";

    /**
     *  @class save or delete reservation
     *  @name Y.Plugin.Planification
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
            Planification = Y.Base.create("wegas-pmg-planification", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Planification */

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
                    i, planPeriode;

            for (i = 0; i < vd.getInstance().get("plannification").length; i++) {
                planPeriode = vd.getInstance().get("plannification")[i];
                if (planPeriode === periode) {
                    // remove plannif
                    this.request(vd.getInstance().get("id"), periode, "DELETE");
                    return;
                }
            }
            // add plannif
            this.request(vd.getInstance().get("id"), periode, "POST");
        },
        request: function(taskInstanceId, periode, method) {
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ResourceDescriptor/Plannification/" + taskInstanceId + "/" + periode,
                cfg: {
                    method: method
                }
            });
        }
    }, {
        ATTRS: {
        },
        NS: "planification",
        NAME: "Planification"
    });
    Y.namespace("Plugin").Planification = Planification;
});
