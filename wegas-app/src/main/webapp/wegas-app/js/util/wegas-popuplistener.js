/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
        if (Y.Lang.isString(o)) {
            o = {
                content: o
            };
        }
        return o;
    }, PopupListener = Y.Base.create("wegas-popuplistener", Y.Plugin.Base, [], {
        DEFAULT_CONFIG: function() {
            return {
                align: {
                    node: this.get("host").get("contentBox"),
                    points: [Y.WidgetPositionAlign.TC, Y.WidgetPositionAlign.TC]
                },
                buttons: {
                    footer: [
                        {
                            name: 'proceed',
                            label: 'OK',
                            action: function() {
                                this.hide();
                            }
                        }
                    ]
                },
                modal: false,
                centered: false,
                content: ""
            };
        },
        handlers: [],
        initializer: function() {
            var bb = this.get("host").get("boundingBox");
            this.handlers = [];
            //this.instance = new Y.Wegas.PopupContent({render: this.get("host").get("boundingBox")});
            this.handlers.push(bb.on("dom-message:showPopup", this._show, this));
            this.handlers.push(bb.on("dom-message:error", this._system, this, "error"));
            this.handlers.push(bb.on("dom-message:success", this._system, this, "success"));
            this.handlers.push(bb.on("dom-message:info", this._system, this, "info"));
            this.handlers.push(bb.on("dom-message:warn", this._system, this, "warn"));
        },
        _show: function(event) {
            var instance;
            event = stringToObject(event);
            event = Y.mix(this.DEFAULT_CONFIG(), event, true, null, 0, false);
            instance = new Y.Wegas.PopupContent(event).render(this.get("host").get("boundingBox")).show();
            if (event.timeout) {
                Y.later(event.timeout, instance, instance.hide);
            }
//            this.instance.setAttrs(event);
//            this.instance.show();
        },
        _system: function(event, lvl) {
            event = stringToObject(event);
            this._show({
                content: "<div class='icon icon-" + lvl + "'>" + ((event && event.content) ? event.content : "") + "</div>",
                timeout: event.timeout ? event.timeout : false
            });
        },
        destructor: function() {
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
            this.instance.destroy();
        }
    }, {
        NS: "popuplistener"
    });

    Y.namespace("Plugin").PopupListener = PopupListener;
    /**
     * Simulate a DOM Event bubbling up to a listener and stops.
     * @param {String} type
     * @param {Object} data
     */
    Y.Node.prototype.emitDOMMessage = function(type, data) {
        var ev = "dom-message:" + type;
        try {
            this.ancestor(function(node) {
                return node.getEvent(ev) ? true : false;
            }, true).fire(ev, data);
        } catch (e) {
            //no ancestor found
        }
    };
});
