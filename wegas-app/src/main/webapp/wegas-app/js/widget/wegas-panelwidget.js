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
YUI.add('wegas-panelwidget', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.PanelWidget
     * @extends Y.Panel
     * @class  class for creating panel from a JSON file with children
     * @constructor
     * @param Object Will be used to fill attributes field
     * @description Create a panel with all children
     */
    var PanelWidget = Y.Base.create("wegas-panelwidget", Y.Wegas.Panel, [Y.WidgetChild, Y.Wegas.Layout, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.PanelWidget# */

    }, {
        /** @lends Y.Wegas.PanelWidget */

    });
    Y.namespace('Wegas').PanelWidget = PanelWidget;

});
