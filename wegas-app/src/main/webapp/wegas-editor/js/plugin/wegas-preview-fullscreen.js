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

    Y.Plugin.BlockAction = Y.Base.create("wegas-preview-fullscreen", Y.Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent("render", this.render);

            Y.publish("playerAction", {
                emitFacade: true
            });
            Y.on("playerAction", function(e) {
                if (this.viewButton.get("pressed")
                    && this.get("host").get("parent").get("selected")) {        // @hack the plugin is only active when the preview tab is selected
                    e.halt(true);
                }
            }, this);
        },
        render: function() {
            var host = this.get('host');

            if (host.toolbar) {
                this.viewButton = host.toolbar.add({
                    type: "ToggleButton",
                    pressed: true
                }).item(0);

                this.viewButton.after("pressedChange", this.sync, this);
                this.sync();
            }
        },
        sync: function() {
            this.viewButton.set("label", this.viewButton.get("pressed") ?
                "<span class='wegas-icon wegas-icon-lock'></span>Block actions"
                : "<span class='wegas-icon wegas-icon-unlock'></span>Allow actions");
        }
    }, {
        NS: "BlockAction"
    });
});
