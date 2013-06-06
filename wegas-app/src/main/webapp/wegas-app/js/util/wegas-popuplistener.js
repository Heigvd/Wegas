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
    var PopupListener = Y.Base.create("wegas-popuplistener", Y.Plugin.Base, [], {
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
            this.handlers = [];
            this.instance = new Y.Wegas.PopupContent({render: this.get("host").get("boundingBox")});
            this.handlers.push(Y.on("popup:show", this._show, this));
            this.handlers.push(Y.on("popup:error", this._error, this));
            this.handlers.push(Y.on("popup:success", this._success, this));
            this.handlers.push(Y.on("popup:info", this._info, this));
            this.handlers.push(Y.on("popup:warning", this._warning, this));
        },
        _show: function(event) {
            event = Y.mix(this.DEFAULT_CONFIG(), event, true, null, 0, false);
            this.instance.setAttrs(event);
            this.instance.show();
        },
        _error: function(data) {
            this._show({content: "<div class='icon icon-error'>" + ((data && data.content) ? data.content : "") + "</div>"});
        },
        _success: function(data) {
            this._show({content: "<div class='icon icon-success'>" + ((data && data.content) ? data.content : "") + "</div>"});
        },
        _info: function(data) {
            this._show({content: "<div class='icon icon-info'>" + ((data && data.content) ? data.content : "") + "</div>"});
        },
        _warning: function(data) {
            this._show({content: "<div class='icon icon-warning'>" + ((data && data.content) ? data.content : "") + "</div>"});
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
});
