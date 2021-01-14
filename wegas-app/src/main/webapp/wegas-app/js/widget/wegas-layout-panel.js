/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-layout-panel', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.PanelWidget
     * @extends Y.Panel
     * @class  class for creating panel from a JSON file with children
     * @constructor
     * @param Object Will be used to fill attributes field
     * @description Create a panel with all children
     */
    var PanelWidget = Y.Base.create("wegas-panelwidget", Y.Wegas.Panel, [Y.Wegas.Parent, Y.WidgetChild, Y.Wegas.Editable], {
        /** @lends Y.Wegas.PanelWidget# */

    }, {
        /** @lends Y.Wegas.PanelWidget */
    });
    Y.Wegas.PanelWidget = PanelWidget;
});
