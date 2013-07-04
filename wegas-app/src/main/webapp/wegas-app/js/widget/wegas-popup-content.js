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
YUI.add('wegas-popup-content', function(Y) {
    "use strict";
    Y.namespace("Wegas").PopupContent = Y.Base.create("wegas-popup-content",
            Y.Widget,
            [Y.WidgetPosition,
                Y.WidgetStdMod,
                Y.WidgetButtons,
                Y.WidgetModality,
                Y.WidgetPositionAlign,
                Y.WidgetStack], {
        syncUI: function() {
            this.set("content", this.get("content"));
        },
        exit: function() {
            this.get("boundingBox").hide(true);
            Y.later(1000, this, this.destroy);
        }
    }, {
        CSS_PREFIX: "wegas-popup",
        ATTRS: {
            align: {"transient": true},
            alignOn: {"transient": true},
            content: {
                value: "",
                type: "string",
                format: "html",
                setter: function(val) {
                    this.set("bodyContent", val);
                    return val;
                }
            },
            bodyContent: {
                "transient": true
            },
            buttons: {
                "transient": true,
                value: {
                    footer: [
                        {
                            name: 'proceed',
                            label: 'OK',
                            action: function() {
                                this.exit();
                            }
                        }
                    ]
                }
            },
            centered: {
                value: true,
                "transient": true
            },
            defaultButton: {"transient": true},
            fillHeight: {"transient": true},
            focusOn: {"transient": true},
            footerContent: {"transient": true},
            headerContent: {"transient": true},
            maskNode: {"transient": true},
            modal: {
                value: false,
                type: "boolean",
                _inputex: {
                    label: "Modal"
                }
            },
            visible: {value: false},
            shim: {"transient": true},
            x: {"transient": true},
            xy: {"transient": true},
            y: {"transient": true},
            zIndex: {value: 100, "transient": true}
        }

    });
});
