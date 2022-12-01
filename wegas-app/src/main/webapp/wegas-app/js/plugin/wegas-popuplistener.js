/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-popuplistener', function(Y) {
    "use strict";

    var PopupListener, HOST = "host", Plugin = Y.Plugin;

    PopupListener = Y.Base.create("wegas-popuplistener", Plugin.Base, [], {
        initializer: function() {
            this.counter = 0;
            this.onHostEvent("*:showOverlay", this.onShowOverlay);
            this.onHostEvent("*:hideOverlay", this.onHideOverlay);
            this.onHostEvent("*:message", this.onShowMessage);
        },
        destructor: function() {
            PopupListener.hideOverlay(this.get(HOST).get(this.get("targetAttr")));
        },
        onShowMessage: function(e) {
            if (this.get("filter") && this.get("filter").indexOf(e.level) > -1) {
                return;
            }

            if (e.level === "successPopup") {                                   // @hack to create popups that will not be displayed in the toolbar
                e.level = "success";
            }

            if (e.level) {
                e.content = "<div class='icon icon-" + e.level + "'>" + (e.content) + "</div>";
            }
            this._showMessage(e);
            e.halt(true);
        },
        _showMessage: function(event) {
            var host = this.get(HOST),
                cfg = Y.mix({
                    align: {
                        // Align on page loader if inside editor, otherwise align on viewport:
                        node: this.get("alignAttr") ? host.get(this.get("alignAttr")) : null,
                        points: [Y.WidgetPositionAlign.TC, Y.WidgetPositionAlign.TC]
                    },
                    centered: false,
                    width: "auto"
                }, event, true),
                panel = (new Y.Wegas.Panel(cfg)).render(host.get(this.get("targetAttr")));

            if (event.timeout) {
                setTimeout(function() {
                    panel.get("destroyed") || panel.exit();
                }, event.timeout);
            }
        },
        onShowOverlay: function(e, klass) {
            var node = this.get(HOST).get(this.get("targetAttr"));
            if (this.counter === 0) {
                PopupListener.showOverlay(node);
            }
            if (klass) {
                node.addClass(klass);
            }
            this.counter += 1;
            e.halt(true);
        },
        onHideOverlay: function(e, klass) {
            var node = this.get(HOST).get(this.get("targetAttr"));
            this.counter -= 1;

            if (this.counter < 1) {
                PopupListener.hideOverlay(node);
                this.counter = 0;
            }
            if (klass) {
                node.removeClass(klass);
            }
            e.halt(true);
        }
    }, {
        NS: "popuplistener",
        ATTRS: {
            filter: {},
            targetAttr: {
                value: "boundingBox"
            },
            alignAttr: {
                value: "contentBox"
            }
        },
        showOverlay: function(node) {
            node.addClass("wegas-loading")
                .prepend(
                    "<div class='wegas-loading-overlay'><div class='wegas-loader'><div class='bar'></div><div class='bar'></div><div class='bar'></div></div></div>");

            Y.later(8000, this, function() {
                node.all(".wegas-loading-overlay").addClass("wegas-loading-long");
            });
        },
        hideOverlay: function(node) {
            node.removeClass("wegas-loading")
                .all("> .wegas-loading-overlay").remove(true);
        }

    });
    Plugin.PopupListener = PopupListener;

    /**
     *
     */
    Plugin.ServerPopupListener = Y.Base.create("wegas-serverpopuplistener", Plugin.Base, [], {
        initializer: function() {
            this.handler = Y.Wegas.Facade.Variable.on("popupEvent", function(e) {
                this.get(HOST).showMessage("info", e.content, e.timeout);
            }, this);
            this.handlerNotif = Y.Wegas.Facade.Variable.on("notificationEvent", function(e) {
                Y.Wegas.Alerts.showNotification(e.content, {
                    timeout: e.timeout,
                    iconCss: e.iconCss
                });
            }, this);
        },
        destructor: function() {
            this.handler.detach();
            this.handlerNotif.detach();
        }
    }, {
        NS: "ServerPopupListener"
    });
});
