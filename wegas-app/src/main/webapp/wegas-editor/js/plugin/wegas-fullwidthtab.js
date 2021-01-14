/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview Tab plugin for full width.
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add("wegas-fullwidthtab", function(Y) {
    "use strict";

    Y.Plugin.FullWidthTab = Y.Base.create("wegas-pageeditor-fullwidthtab",
        Y.Plugin.Base,
        [Y.Wegas.Plugin,
            Y.Wegas.Editable],
        {
            initializer: function() {
                this.onceAfterHostEvent("render", function() {
                    var host = this.get("host"), item,
                        tabview = host.get("parent"),
                        layoutCenter = host.get("root").get("boundingBox").ancestor();
                    Y.on("windowresize", Y.bind(function() {
                        tabview._set("selection", tabview.get("selection"));
                    }, this));
                    this.handler = tabview.after("selectionChange", function(e) {
                        item = tabview.item(e.target.get("selection").get("index"));
                        if (item.FullWidthTab) {
                            if (!tabview.oldPosition) {
                                tabview.oldPosition = {
                                    left: layoutCenter.getStyle("left"),
                                    right: layoutCenter.getStyle("right")
                                };
                            }
                            layoutCenter.setStyle("left", "-8px");
                            //                                layoutCenter.setStyle("right", "-8px");
                            layoutCenter.setStyle("zIndex", 1);

                        } else {
                            if (tabview.oldPosition) {
                                layoutCenter.setStyle("left", tabview.oldPosition.left);
                                layoutCenter.setStyle("right", tabview.oldPosition.right);
                                layoutCenter.setStyle("zIndex", "auto");
                                tabview.oldPosition = null;
                            }
                        }
                    });
                });
            },
            destructor: function() {
                this.handler.detach();
            }
        },
        {
            NS: "FullWidthTab"
        });
});
