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
YUI.add('wegas-popuplistener', function(Y) {
    "use strict";
    var stringToObject = function(o) {
        return (Y.Lang.isString(o)) ? {content: o} : o;
    },
            PopupListener = Y.Base.create("wegas-popuplistener", Y.Plugin.Base, [], {
        DEFAULT_CONFIG: function() {
            return {
                align: {
                    node: this.get("host").get(this.get("alignAttr")),
                    points: [Y.WidgetPositionAlign.TC, Y.WidgetPositionAlign.TC]
                },
                buttons: {
                    footer: [
                        {
                            name: 'proceed',
                            label: 'OK',
                            action: "exit"
                        }
                    ]
                },
                modal: false,
                centered: false,
                width: "80%"
            };
        },
        handlers: [],
        initializer: function() {
            var bb = this.get("host").get(this.get("targetAttr"));

            this.handlers = [
                bb.on("dom-message:showPopup", this._show, this),
                bb.on("dom-message:error", this._system, this, "error"),
                bb.on("dom-message:success", this._system, this, "success"),
                bb.on("dom-message:info", this._system, this, "info"),
                bb.on("dom-message:warn", this._system, this, "warn")
            ];

            this.onHostEvent("*:showOverlay", this.onShowOverlay);
            this.onHostEvent("*:hideOverlay", this.onHideOverlay);
            this.onHostEvent("*:message", this.onShowMessage);

            if (this.get("showServerMessages")) {
                this.handlers.push(Y.Wegas.Facade.VariableDescriptor.on("popupEvent", function(e) {
                    this.get("host").showMessage("info", e.content);
                }, this));
            }
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        _show: function(event) {
            var instance;
            event = stringToObject(event);
            event = Y.mix(this.DEFAULT_CONFIG(), event, true, null, 0, false);
            instance = new Y.Wegas.Panel(event).render(this.get("host").get(this.get("targetAttr")));
            instance.show();
            if (event.timeout) {
                setTimeout(function() {
                    instance && instance.exit();
                }, event.timeout);
                // Y.later(event.timeout, instance, instance.hide);
            }
            // this.instance.setAttrs(event);
            // this.instance.show();
        },
        _system: function(event, lvl) {
            event = stringToObject(event);
            this._show({
                content: "<div class='icon icon-" + lvl + "'>" + ((event && event.content) ? event.content : "") + "</div>",
                timeout: event.timeout ? event.timeout : false
            });
        },
        onShowMessage: function(e) {
            if (e.level) {
                e.content = "<div class='icon icon-" + e.level + "'>" + (e.content) + "</div>";
            }
            this._show(e);
            e.halt(true);
        },
        onShowOverlay: function(e) {
            this.get("host").get(this.get("targetAttr"))
                    .addClass("wegas-loading")
                    .prepend("<div class='wegas-loading-overlay'></div>");
            e.halt(true);
        },
        onHideOverlay: function(e) {
            this.get("host").get(this.get("targetAttr"))
                    .removeClass("wegas-loading")
                    .all("> .wegas-loading-overlay").remove(true);
            e.halt(true);
        }
    }, {
        NS: "popuplistener",
        ATTRS: {
            targetAttr: {
                value: "boundingBox"
            },
            alignAttr: {
                value: "contentBox"
            },
            showServerMessages: {
                value: false
            }
        }
    });

    Y.namespace("Plugin").PopupListener = PopupListener;
});
