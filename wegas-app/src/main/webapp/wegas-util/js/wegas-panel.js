/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-panel', function(Y) {
    "use strict";

    var Wegas = Y.namespace("Wegas");

    Wegas.Panel = Y.Base.create("wegas-panel", Y.Widget,
        [Y.WidgetParent, Y.WidgetPosition, Y.WidgetStdMod, Y.WidgetButtons,
            Y.WidgetModality, Y.WidgetPositionAlign, Y.WidgetStack], {
        initializer: function(cfg) {
            Wegas.Panel.superclass.initializer.apply(this, arguments);
            if (typeof cfg.cssClass === "string") {
                this.get("contentBox").addClass(cfg.cssClass);
            }
        },
        renderUI: function() {
            this._childrenContainer = this.getStdModNode(Y.WidgetStdMod.BODY, true);
            this._stdModParsed = {
                bodyContent: 1
            };
        },
        bindUI: function() {
            this.windowHandler = Y.after("windowresize", Y.bind(function() {
                /*
                 @HACK
                 Hide - sync - show
                 Avoid Widget modal to stack it again. As it will destroy it only once.
                 */
                this.hide();
                this.syncUI();
                this.show();
            }, this));
        },
        syncUI: function() {
            this.set("content", this.get("content"));
            // this.fillHeight(this.getStdModNode(Y.WidgetStdMod.BODY));
        },
        exit: function() {
            this.destroy();
            //this.get("boundingBox").hide(true);
            //Y.later(500, this, this.destroy);
        },
        destructor: function() {
            this.windowHandler.detach();
        }
    }, {
        CSS_PREFIX: "wegas-panel",
        ATTRS: {
            align: {
                "transient": true
            },
            alignOn: {
                "transient": true
            },
            content: {
                value: "",
                type: "string",
                format: "html",
                setter: function(val) {
                    if (val) {
                        this.set("bodyContent", val);
                    }
                    return val;
                }
            },
            bodyContent: {
                "transient": true
            },
            buttons: {
                "transient": true,
                value: {
                    footer: [{
                            name: 'proceed',
                            label: 'OK',
                            action: "exit"
                        }]
                }
            },
            centered: {
                value: true,
                "transient": true
            },
            defaultButton: {
                "transient": true
            },
            fillHeight: {
                "transient": true
            },
            focusOn: {
                "transient": true
            },
            footerContent: {
                "transient": true
            },
            headerContent: {
                "transient": true
            },
            maskNode: {
                "transient": true
            },
            modal: {
                value: false,
                type: "boolean"
            },
            shim: {
                "transient": true
            },
            x: {
                "transient": true
            },
            xy: {
                "transient": true
            },
            y: {
                "transient": true
            },
            zIndex: {
                value: 100000,
                getter: function(val) {
                    return val + Y.all("body > .wegas-panel").size();
                },
                "transient": true
            }
        },
        confirm: function(msg, okCb, cancelCb, okLabel, cancelLabel) {
            var panel = new Wegas.Panel({
                content: "<div class='icon icon-info'>" + msg + "</div>",
                modal: true,
                width: 400,
                buttons: {
                    footer: [{
                            label: okLabel || I18n.t('global.ok') || 'OK',
                            action: function() {
                                panel.exit();
                                okCb && okCb();
                            }
                        }, {
                            label: cancelLabel || I18n.t('global.cancel') || 'Cancel',
                            action: function() {
                                panel.exit();
                                cancelCb && cancelCb();
                            }
                        }]
                }
            }).render();
            //bodyNode = panel.getStdModNode("body", true);
            // For client-side customization:
            return panel;
        },
        confirmPlayerAction: function(cb) {
            if (!Y.fire("playerAction", {})) {
                Wegas.Panel.confirm("This action will impact player data, proceed?", cb);
            } else {
                cb();
            }
        },
        prompt: function(msg, okCb, cancelCb, okLabel, cancelLabel) {
            var panel = new Wegas.Panel({
                headerContent: "<span class='fa fa-question fa-2x'></span><span style='margin-left:10px'>" +
                    Y.Escape.html(msg) + "</span>",
                content: "<input class='prompt-value' type='text' style='width:97%'> </input>",
                modal: true,
                width: 400,
                buttons: {
                    footer: [{
                            label: okLabel || I18n.t('global.ok') || 'OK',
                            action: function() {
                                var v = this.get("bodyContent").filter(".prompt-value").item(0).get("value");
                                panel.exit();
                                okCb && okCb(v);
                            }
                        }, {
                            label: cancelLabel || I18n.t('global.cancel') || 'Cancel',
                            action: function() {
                                panel.exit();
                                cancelCb && cancelCb();
                            }
                        }]
                }
            }).render();
            // For client-side customization:
            return panel;
        },
        alert: function(msg, okCb, okLabel) {
            var panel = new Wegas.Panel({
                content: "<div class='icon icon-warn'>" + msg + "</div>",
                modal: true,
                width: 400,
                buttons: {
                    footer: [{
                            label: okLabel || I18n.t('global.ok') || 'OK',
                            action: function() {
                                panel.exit();
                                okCb && okCb();
                            }
                        }]
                }
            }).render();
            // For client-side customization:
            return panel;
        },
        /**
         *
         * @param {type} children children cfg
         * @param {type} userCfg {width: 80%, height: 80%, modal: true, style:"modern" | "legacy", title: null, titleVariable:null, cssClass}
         * @returns {undefined}
         */
        openOverlay: function(children, userCfg) {
            var uCfg = Y.mix(
                Y.mix({}, userCfg),
                {
                    children: children,
                    width: "80%",
                    height: "80%",
                    modal: true,
                    style: "modern",
                    title: null,
                    titleVariable: null,
                    cssClass: null
                });

            var btn = new Y.Wegas.Button();
            btn.plug(Y.Plugin.OpenPanelWithCfg, uCfg);
            btn.wegaspanelwithcfg.execute();
        }
    });

    var DraggablePanel = Y.Base.create("wegas-panel-draggable", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            var panel = this.get("host");
            panel.get("boundingBox").addClass("draggable");
            this.onMouseDown = panel.on("mousedown", function(e) {
                if (e.domEvent.button === 1) {
                    panel.get("boundingBox").addClass("dragging");
                    panel.orig = {
                        x: panel.get("x"),
                        y: panel.get("y")
                    };
                    panel.drag = {
                        x: e.domEvent.pageX,
                        y: e.domEvent.pageY
                    };
                }
            }, this);

            this.onMouseUp = Y.on("mouseup", function(e) {
                if (e.button === 1 && panel.orig) {
                    panel.get("boundingBox").removeClass("dragging");
                    panel.orig = null;
                    panel.clickOrig = null;
                }
            });

            this.onMouseMove = Y.on("mousemove", function(e) {
                if (e.button === 1 && panel.orig) {
                    var dx = e.pageX - panel.drag.x;
                    var dy = e.pageY - panel.drag.y;
                    if (Math.abs(dy) + Math.abs(dy) > 20) {
                        panel.set("x", panel.orig.x + dx);
                        panel.set("y", panel.orig.y + dy);
                    }
                }
            });
        },
        destructor: function() {
            this.onMouseMove.detach();
            this.onMouseDown.detach();
            this.onMouseUp.detach();
        }
    }, {
        NS: "draggablepanel"
    });
    Y.Plugin.DraggablePanel = DraggablePanel;
});
