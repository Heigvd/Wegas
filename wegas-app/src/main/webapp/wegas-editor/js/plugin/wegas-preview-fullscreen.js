/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-preview-fullscreen", function(Y) {
    "use strict";

    Y.Plugin.PreviewFullScreen = Y.Base.create("wegas-preview-fullscreen", Y.Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent("render", this.render);
        },
        render: function() {
            var host = this.get('host');

            if (host.toolbar) {
                this.swapNode = Y.Node.create("<span class='wegas-fullscreen'></span>");
                Y.one("body").append(this.swapNode);

                var fullScreenButton = host.toolbar.add({
                    type: "ToggleButton",
                    label: "<span class='wegas-icon wegas-icon-fullscreen'></span>Fullscreen"
                }).item(0);

                fullScreenButton.after("pressedChange", function() {
                    host.get("boundingBox").swap(this.swapNode);
                }, this);
            }
        },
        destructor: function() {
            if (this.swapNode) {
                this.swapNode.destroy(true);
            }
        }
    }, {
        NS: "preview"
    });
});
