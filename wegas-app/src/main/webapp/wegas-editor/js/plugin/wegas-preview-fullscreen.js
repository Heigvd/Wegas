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

    Y.namespace("Plugin").PreviewFullScreen = Y.Base.create("wegas-preview-fullscreen", Y.Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent("render", this.render);
            this.handlers = [];
        },
        render: function() {
            var el, host = this.get('host');

            if (host.toolbar) {
                this.swapNode = Y.Node.create("<span><span>");
                Y.one("body").append(this.swapNode);
                el = host.toolbar.get('header');
                this.fullScreenButton = new Y.ToggleButton({
                    label: "<span class='wegas-icon'></span>Fullscreen"
                }).render(el);
                this.handlers.push(this.fullScreenButton.after("pressedChange", function() {
                    this.get("host").get("boundingBox").swap(this.swapNode);
                }, this));
            }
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
            this.handlers = [];
            if (this.fullScreenButton) {
                this.fullScreenButton.destroy();
            }
            if (this.swapNode) {
                this.swapNode.destroy(true);
            }
        }
    }, {NS: "preview"});
});
