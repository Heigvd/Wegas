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

    Y.Plugin.FullWidthTab = Y.Base.create("wegas-pageeditor-fullwidthtab", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            this.handlers = [];
            var host = this.get("host"), layoutCenter, tabview, item;
            this.onceAfterHostEvent("render", function() {
                tabview = host.get("parent");
                layoutCenter = host.get("root").get("boundingBox").ancestor();
                this.handlers.push(tabview.after("selectionChange", function(e) {
                    item = tabview.item(e.target.get("selection").get("index"));
                    if (item.FullWidthTab) {
                        if (!tabview.oldPosition) {
                            tabview.oldPosition = layoutCenter.getStyle("left");
                            layoutCenter.setStyle("left", "-8px");
                        }
                    } else {
                        if (tabview.oldPosition) {
                            layoutCenter.setStyle("left", tabview.oldPosition);
                            tabview.oldPosition = null;
                        }
                    }
                }));
            });
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        NS: "FullWidthTab"
    });
});
