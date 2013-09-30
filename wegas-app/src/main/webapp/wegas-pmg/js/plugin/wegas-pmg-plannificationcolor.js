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
YUI.add('wegas-pmg-plannificationcolor', function(Y) {
    "use strict";

    /**
     *  @class color plannification in datatable
     *  @name Y.Plugin.Plannificationcolor
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
            Plannificationcolor = Y.Base.create("wegas-pmg-plannificationcolor", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Plannificationcolor */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.onceAfterHostEvent("render", function() {
                this.findCell();

                this.afterHostMethod("syncUI", this.findCell);

                this.get("host").datatable.after("sort", this.findCell, this);
            });
        },
        findCell: function() {
            Y.log("findCell()", "log", "Wegas.Plannificationcolor");
            var i, ii, host = this.get("host"),
                    dt = host.datatable,
                    plannification;

            for (i = 0; i < dt.data.size(); i++) {
                plannification = dt.data.item(i).get("descriptor").getInstance().get("plannification");
                for (ii = 0; ii < plannification.length; ii++) {
                    this.addColor(host.schedule.getCell(i, plannification [ii] - 1));
                }
            }
        },
        addColor: function(cell) {
            cell.append("<span class='editable plannification'></span>");
        }
    }, {
        ATTRS: {
        },
        NS: "plannificationcolor",
        NAME: "Plannificationcolor"
    });
    Y.namespace("Plugin").Plannificationcolor = Plannificationcolor;
});
