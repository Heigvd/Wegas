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
YUI.add('wegas-pmg-plannificationcolor', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, Plannificationcolor;

    /**
     *  @class color plannification in datatable
     *  @name Y.Plugin.Plannificationcolor
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    Plannificationcolor = Y.Base.create("wegas-pmg-plannificationcolor", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Plannificationcolor */

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
            Y.log("sync()", "log", "Wegas.Plannificationcolor");
            var i, ii, host = this.get("host"),
                dt = host.datatable,
                plannification;

            for (i = 0; i < dt.data.size(); i += 1) {
                plannification = Y.Array.unique(dt.data.item(i).get("descriptor").getInstance().get("plannification"));
                for (ii = 0; ii < plannification.length; ii += 1) {
                    host.schedule.getCell(i, plannification[ii]).append("<span class='editable baseline'></span>");
                }
            }
        }
    }, {
        NS: "plannificationcolor"
    });
    Y.Plugin.Plannificationcolor = Plannificationcolor;
});
