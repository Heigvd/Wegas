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
            var dt = this.get("host").datatable,
                time = dt.getColumn(e.currentTarget).time,
                task = dt.getRecord(e.currentTarget).get("descriptor").getInstance(),
                cell = dt.getCell(e.currentTarget),
                action = "POST";

            if (cell.get("children").size() > 0) {
                action = "DELETE";
            }
            Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                this.request(task.get("id"), time, action, cell);
            }, this));
        },
        request: function(taskInstanceId, time, method, cell) {
            Wegas.Facade.Variable.sendQueuedRequest({
                request: "/ResourceDescriptor/Player/" + Wegas.Facade.Game.get('currentPlayerId') + "/Plan/" + taskInstanceId + "/" + time,
                cfg: {
                    method: method,
                    updateEvent: false
                },
                on: {
                    success: function() {
                        if (method === "DELETE") {
                            cell.setContent("");
                        } else {
                            cell.append('<span class="booked planning"></span>');
                        }
                    }
                }
            });
        }
    }, {
        NS: "planification",
        NAME: "Planification"
    });
    Y.Plugin.Planification = Planification;
});
