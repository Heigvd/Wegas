/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileOverview PageEditor full width centertab Extension
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add("wegas-pageeditor-fullwidthtab", function(Y) {
    "use strict";

    Y.Plugin.PageeditorFullWidthTab = Y.Base.create("wegas-pageeditor-fullwidthtab", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            var host = this.get("host"), layoutCenter;
            host.on("selectedChange", function(e) {
                layoutCenter = host.get("root").get("boundingBox").ancestor();
                if (e.newVal === 0) {
                    layoutCenter.setStyle("left", this.oldPosition);
                } else {
                    this.oldPosition = layoutCenter.getStyle("left");
                    layoutCenter.setStyle("left", "-8px");
                }
            }, this);
        }
    }, {
        NS: "PageeditorFullWidthTab"
    });
});
