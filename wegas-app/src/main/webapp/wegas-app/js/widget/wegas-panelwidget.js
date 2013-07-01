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
YUI.add('wegas-panelwidget', function (Y) {
    "use strict";

    /**
    * @name Y.Wegas.PanelWidget
    * @extends Y.Panel
    * @class  class for creating panel from a JSON file with children
    * @constructor
    * @param Object Will be used to fill attributes field
    * @description Create a panel with all children
    */
    var PanelWidget = Y.Base.create("wegas-panelwidget", Y.Panel, [Y.WidgetChild, Y.Wegas.Widget], {
        /** @lends Y.Wegas.PanelWidget# */

        /**
         * @function
         * @private
         * @description Instantiates all children widget
         */
        syncUI: function () {
            PanelWidget.superclass.syncUI.apply(this);
            Y.Array.forEach(this.get("children"), function (child) {
                var widget = Y.Wegas.Widget.create(child);
                widget.render(this.get("contentBox"));
            }, this);
        }

    }, {
        /** @lends Y.Wegas.PanelWidget */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>chlidren: All children widget used</li>
         *    <li>zIndex : define a default zIndex</li>
         * </ul>
         */
        ATTRS: {
            children: {
                value: []
            },
            zIndex: {
                value: 6
            }
        }

    });
    Y.namespace('Wegas').PanelWidget = PanelWidget;

});
