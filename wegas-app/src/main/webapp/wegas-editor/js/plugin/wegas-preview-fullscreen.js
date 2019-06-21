/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
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
                Y.one(this.get("selector")).append(this.swapNode);

                var fullScreenButton = host.toolbar.add({
                    type: "ToggleButton",
                    label: "<span class='fa fa-arrows-alt'></span> Fullscreen"
                }).item(0);

                fullScreenButton.after('pressedChange', function(event) {
                    Y.one("body").toggleClass("fullscreened", event.newVal);
                    if (event.newVal) {
                        this.swapNode.siblings().each(function(n) {
                            n.hide();
                        });
                    }
                    host.get('boundingBox')
                        .swap(this.swapNode);
                    if (!event.newVal) {
                        this.swapNode.siblings().each(function(n) {
                            n.show();
                        });
                    }
                }, this);

                /** Refresh **/
                this.refreshButton = host.toolbar.add({
                    label: "<span class='wegas-icon wegas-icon-pagerefresh'></span>Refresh"
                }).item(0);
                this.refreshButton.get("boundingBox").addClass("wegas-button-pagerefresh");
                this.refreshButton.after("click", function(e) {
                    this.get("host").reload();
                }, this);
            }
        },
        destructor: function() {
            if (this.swapNode) {
                this.swapNode.destroy(true);
            }
        }
    }, {
        NS: "preview",

        ATTRS: {
            selector: {
                type: "string",
                value: "body"
            },
        }
    });
    Y.Plugin.BlockAction = Y.Base.create("wegas-blockaction", Y.Plugin.Base, [], {
        initializer: function() {

            Y.publish("playerAction", {
                emitFacade: true
            });
            this.handler = Y.on("playerAction", function(e) {
                if (this.get("host").get("parent").get("selected") && this.doBlock(e)) { // @hack the plugin is only active when the preview tab is selected
                    e.halt(true);
                }
            }, this);
        },
        doBlock: function() {
            return true;
        },
        destructor: function() {
            this.handler.detach();
        }
    }, {
        NS: "BlockAction"
    });

    Y.Plugin.BlockAnyAction = Y.Base.create("wegas-blockanyaction", Y.Plugin.Base, [], {
        initializer: function() {

            Y.publish("playerAction", {
                emitFacade: true
            });
            this.handler = Y.on("playerAction", function(e) {
                e.halt(true);
            }, this);
        },
        doBlock: function() {
            return true;
        },
        destructor: function() {
            this.handler.detach();
        }
    }, {
        NS: "BlockAction"
    });
    Y.Plugin.ToggleBlockAction = Y.Base.create("wegas-toggle-blockaction", Y.Plugin.BlockAction, [], {
        initializer: function() {
            this.afterHostEvent("render", this.render);
        },
        doBlock: function() {
            return this.viewButton.get("pressed");
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
        },
        destructor: function() {
            this.viewButton.destroy();
        }
    }, {
        NS: "BlockAction"
    });
});
