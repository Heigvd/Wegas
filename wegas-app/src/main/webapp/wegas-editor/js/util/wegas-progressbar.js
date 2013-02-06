/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
            var bbStyle = this.get(BOUNDING_BOX).getDOMNode().style;
            bbStyle.border = "1px solid " + this.get("color");
            bbStyle.borderRadius = "5px";
            bbStyle.display = "inline-block";
            bbStyle.textAlign = "center";
            bbStyle.fontSize = this.get("height");
            bbStyle.position = "relative";
            this.labelNode.setStyles({
                "backgroundColor": "transparent",
                "position": "absolute",
                "top": "0px",
                "left": "0px",
                "width": "100%"
            });
            this.get(BOUNDING_BOX).append(this.labelNode);

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
                    if (this.get(CONTENT_BOX).getDOMNode()) {
                        this.get(CONTENT_BOX).getDOMNode().style.width = v + "%";
                        this.set("label", this.get("label"));
                    }
                    return v;
                }
            },
            color: {
                value: "lightblue",
                validator: Y.Lang.isString,
                setter: function(v) {
                    this.get(CONTENT_BOX).getDOMNode().style.backgroundColor = v;
                    this.get(BOUNDING_BOX).getDOMNode().style.borderColor = v;
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