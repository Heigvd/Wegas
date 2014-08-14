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
            this.get("host").datatable.delegate("click", this.onClick,
                "tbody .present, tbody .futur", this);
        },
        onClick: function(e) {
            var i, planPeriod,
                dt = this.get("host").datatable,
                time = dt.getColumn(e.currentTarget).time,
                task = dt.getRecord(e.currentTarget).get("descriptor").getInstance(),
                cell = dt.getCell(e.currentTarget);

            // v1: based on element state
            if (cell.get("children").size() > 0) {
                cell.setContent("");
                this.request(task.get("id"), time, "DELETE");
                return;
            }

            // v2: based on cache state (need to make sure request is finished)
            //for (i = 0; i < task.get("plannification").length; i++) {
            //    planPeriod = task.get("plannification")[i];
            //    if (planPeriod === time) {                                    // remove plannif
            //        this.request(task.get("id"), time, "DELETE");
            //        cell.empty();
            //        return;
            //    }
            //}

            cell.append('<span class="editable plannification"></span>');
            this.request(task.get("id"), time, "POST");                         // add plannif
        },
        request: function(taskInstanceId, time, method) {
            Wegas.Facade.Variable.sendRequest({
                request: "/ResourceDescriptor/Player/" + Wegas.Facade.Game.get('currentPlayerId') + "/Plannification/" + taskInstanceId + "/" + time,
                cfg: {
                    method: method,
                    updateEvent: false
                }
            });
        }
    }, {
        NS: "planification",
        NAME: "Planification"
    });
    Y.Plugin.Planification = Planification;
});
