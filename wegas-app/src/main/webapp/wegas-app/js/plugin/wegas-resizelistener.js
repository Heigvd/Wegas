/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @fileOverview
 * @author maxence
 */
YUI.add('wegas-resizelistener', function(Y) {
    "use strict";
    /**
     * Take a custom cssClass to host contentBox when widget size is smaller than a given threshold
     */
    var ResizeListener = Y.Base.create("wegas-resizelistener", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            var i, k;
            this.handlers = {};
            if (window.ResizeObserver !== undefined) {
                this.resizeObserver = new ResizeObserver(Y.bind(this.resizeListener, this));
                this.resizeObserver.observe(this._getTargetNode());
            } else {
                // rely on document resize and layout-resize
                this._windowResizeCb = Y.bind(this.legacyListener, this);
                window.addEventListener("resize", this._windowResizeCb);
                this.handlers.layoutResize = Y.Wegas.app.on("layout:resize", Y.bind(this.legacyListener, this));
            }
            // first time -> init
            //this.get("host").once("render", this.legacyListener, this);
            Y.later(0, this, this.legacyListener);
        },
        _getTargetNode: function() {
            return this.get("host").get("contentBox").getDOMNode();
        },
        legacyListener: function(e) {
            var node = this._getTargetNode();
            this.checkSize(node.getBoundingClientRect());
        },
        clearClasses: function(attrName) {
            var node = this.get("host").get("contentBox");
            for (var i in this.get(attrName)) {
                var klasses = this.get(attrName)[i].split(" ");
                for (var j in klasses) {
                    var kl = klasses[j];
                    kl && node.removeClass(kl);
                }
            }
        },
        setClasses: function(attr, domAttr, rectProp, newRect) {
            var node = this.get("host").get("contentBox");

            var attrValue = this.get(attr);
            var thresholds = Object.keys(attrValue).sort(function(a, b) {
                return a - b;
            });

            node.removeAttribute(domAttr);

            for (var i in thresholds) {
                var threshold = thresholds[i];
                if (newRect[rectProp] < threshold) {
                    node.setAttribute(domAttr, threshold);
                    var klasses = attrValue[threshold].split(" ");
                    for (var j in klasses) {
                        var kl = klasses[j];
                        kl && node.addClass(kl);
                    }
                    break;
                }
            }
        },

        checkSize: function(newRect) {
            if (this.get("destroyed") || !this.get("initialized")) {
                return;
            }

            if (!this.previousRect || Object.keys(this.get("widthThresholds")).length && newRect.width !== this.previousRect.width) {
                this.clearClasses("widthThresholds");
                this.setClasses("widthThresholds", "data-narrower-than", "width", newRect);
            }

            if (!this.previousRect || Object.keys(this.get("heightThresholds")).length && newRect.height !== this.previousRect.height) {
                this.clearClasses("heightThresholds");
                this.setClasses("heightThresholds", "data-shorter-than", "height", newRect);
            }

            this.previousRect = newRect;
        },
        resizeListener: function(entries) {
            for (var i in entries) {
                var entry = entries[i];
                this.checkSize(entry.contentRect);
            }
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.resizeObserver && this.resizeObserver.disconnect();
            this._windowResizeCb && window.removeEventListener("resize", this._windowResizeCb);

        }
    }, {
        NS: "resizelistener",
        ATTRS: {
            widthThresholds: {
                type: "object",
                value: {},
                additionalProperties: {
                    type: "string",
                    required: true,
                    view: {
                        label: "css class(es)"
                    }
                },
                view: {
                    label: "Width thresholds",
                    type: "hashlist",
                    keyLabel: "Width [px]"
                }
            },
            heightThresholds: {
                type: "object",
                value: {},
                additionalProperties: {
                    type: "string",
                    required: true,
                    view: {
                        label: "css class"
                    }
                },
                view: {
                    label: "Height thresholds",
                    type: "hashlist",
                    keyLabel: "Height [px]",
                    className: 'wegas-advanced-feature' /* is useless, anymay */
                }
            }
        }
    });
    Y.Plugin.ResizeListener = ResizeListener;
});
