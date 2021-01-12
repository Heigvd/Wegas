/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
YUI.add('wegas-progressbar', function(Y) {
    'use strict';
    var ProgressBar,
        BOUNDING_BOX = "boundingBox",
        CONTENT_BOX = "contentBox";
    ProgressBar = Y.Base.create("wegas-progressbar", Y.Widget, [], {
        labelNode: null,
        valueNode: null,
        initializer: function() {
            this.labelNode = Y.Node.create("<div></div>");
            this.valueNode = Y.Node.create("<div></div>");
        },
        renderUI: function() {
            this.get(BOUNDING_BOX).setStyles({
                border: "1px solid " + this.get("color"),
                borderRadius: "5px",
                display: "inline-block",
                textAlign: "center",
                fontSize: this.get("height"),
                position: "relative",
                whiteSpace: "nowrap"});
            this.labelNode.setStyles({
                backgroundColor: "transparent",
                position: "absolute",
                top: "0px",
                left: "0px",
                width: "100%"
            });
            this.get(BOUNDING_BOX).append(this.labelNode);
        },
        bindUI: function() {
            this.after("percentChange", function() {
                this.set("label", this.get("label"));
            });
        },
        syncUI: function() {
            this.set("percent", this.get("percent"));
            this.set("color", this.get("color"));
            this.set("label", this.get("label"));
        }
    }, {
        ATTRS: {
            percent: {
                value: 100,
                setter: function(v) {
                    v = (+v).toFixed(1);
                    this.get(CONTENT_BOX).setStyle("width", v + "%");
                    return v;
                }
            },
            color: {
                value: "lightblue",
                validator: Y.Lang.isString,
                setter: function(v) {
                    this.get(CONTENT_BOX).setStyles({backgroundColor: v, borderColor: v});
                    return v;
                }
            },
            showValue: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    this.set("label", this.get("label"));
                    return v;
                }
            },
            label: {
                value: "",
                validator: Y.Lang.isString,
                setter: function(s) {
                    if (this.get("showValue")) {
                        this.labelNode.setContent(s + " " + this.get("percent") + "%");
                    } else {
                        this.labelNode.setContent(s);
                    }
                    return s;
                }
            }
        }
    });
    Y.namespace("Wegas").ProgressBar = ProgressBar;
});