/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

YUI.add('wegas-panelwidget', function (Y) {
    "use strict";

    var PanelWidget;

    /**
     *
     *  @class Y.Wegas.PanelWidget
     */
    PanelWidget = Y.Base.create("wegas-panelwidget", Y.Panel, [Y.WidgetChild, Y.Wegas.Widget], {

        syncUI: function () {
            PanelWidget.superclass.syncUI.apply(this);
            Y.Array.forEach(this.get("children"), function (child, i){
                var widget = Y.Wegas.Widget.create(child);
                widget.render(this.get("contentBox"));
            }, this); 
        }
    },{
        ATTRS: {
            children: {
                value: []
            }
        }
    }
    );

    Y.namespace('Wegas').PanelWidget = PanelWidget;
});
