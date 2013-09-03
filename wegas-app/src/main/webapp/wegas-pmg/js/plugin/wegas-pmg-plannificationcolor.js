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
            this.get("host").onceAfter("render", function() {
                this.findCell();

                this.afterHostMethod("syncUI", this.findCell);

                this.get("host").datatable.after("sort", this.findCell, this);
            }, this);
        },
        findCell: function() {
            var i, ii, iii, vd, dt = this.get("host").datatable,
                    plannification;

            for (i = 0; i < dt.data._items.length; i++) {
                vd = Y.Wegas.Facade.VariableDescriptor.cache.find("id", dt.data._items[i].get("id"));
                plannification = vd.getInstance().get("plannification");
                for (ii = 0; ii < plannification.length; ii++) {
                    for (iii = 0; iii < dt.get('columns').length; iii++) {
                        if (dt.get('columns')[iii].time === plannification[ii]) {
                            this.addColor(dt.getRow(i).getDOMNode().cells[iii]);
                        }
                    }
                }
            }
        },
        addColor: function(cell) {
            cell.innerHTML = cell.innerHTML + "<span class='editable plannification'></span>";
        }
    }, {
        ATTRS: {
        },
        NS: "plannificationcolor",
        NAME: "Plannificationcolor"
    });
    Y.namespace("Plugin").Plannificationcolor = Plannificationcolor;
});
