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
    
    var Wegas = Y.Wegas, Planification;

    /**
     *  @class save or delete reservation
     *  @name Y.Plugin.Planification
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    Planification = Y.Base.create("wegas-pmg-planification", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Planification */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.get("host").datatable.delegate("click", function(e, a) {
                var dt = this.get("host").datatable,
                        id = dt.getRecord(e.target).get("id"),
                        columnsCfg = dt.get('columns')[dt.getCell(e.target).get("cellIndex")];
                this.checkCache(id, columnsCfg.time);
            }, "tbody .present, tbody .futur", this);
        },
        checkCache: function(descriptorId, periode) {
            var vd = Wegas.Facade.Variable.cache.find("id", descriptorId),
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
            Wegas.Facade.Variable.sendRequest({
                request: "/ResourceDescriptor/Player/" + Wegas.Facade.Game.get('currentPlayerId') + "/Plannification/" + taskInstanceId + "/" + periode,
                cfg: {
                    method: method
                }
            });
        }
    }, {
        NS: "planification",
        NAME: "Planification"
    });
    Y.Plugin.Planification = Planification;
});
