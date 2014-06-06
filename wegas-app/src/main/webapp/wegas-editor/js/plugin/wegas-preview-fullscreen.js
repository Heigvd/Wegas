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
                this.swapNode = Y.Node.create("<span></span>");
                Y.one("body").append(this.swapNode);
                //this.fullScreenButton = host.toolbar.add(new Y.ToggleButton({
                //    label: "<span class='wegas-icon wegas-icon-fullscreen'></span>Fullscreen"
                //})).item(0);

                this.fullScreenButton = new Y.ToggleButton({
                    label: "<span class='wegas-icon wegas-icon-fullscreen'></span>Fullscreen"
                });
                this.fullScreenButton.render(host.toolbar.get("header"));

                this.fullScreenButton.after("pressedChange", function() {
                    this.get("host").get("boundingBox").swap(this.swapNode);
                }, this);
            }
        },
        destructor: function() {
            if (this.fullScreenButton) {
                this.fullScreenButton.destroy();
            }
            if (this.swapNode) {
                this.swapNode.destroy(true);
            }
        }
    }, {
        NS: "preview"
    });
});
