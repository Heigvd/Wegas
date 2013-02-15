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
YUI.add("wegas-flexitests-simpleelement", function(Y) {
    /**
     * @name Y.Wegas.SimpleElement
     * @extends Y.Widget
     * @constructor
     */
    Y.Wegas.SimpleElement = Y.Base.create("wegas-flexitests-simpleelement", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /**
         * @lends Y.Wegas.SimpleElement#
         */
        initializer: function() {
            this.imgEvent;
            this.loadedEvent = this.publish("loaded", {
                fireOnce: true
            });
        },
        syncUI: function() {
            this.loadedEvent.fired = false;                                     /* reset fired event */
            if (this.get("contentType") === "text") {
                this.genText();
            } else if (this.get("contentType") === "img") {
                this.genImg();
            }
        },
        genText: function() {
            this.get("contentBox").setContent(this.get("content"));
            this.fire("loaded");
        },
        genImg: function() {
            this.get("contentBox").setContent("<img src='" + this.get("content") + "' data-file='" + this.get("content") + "'></img>");
            this.imgEvent = this.get("contentBox").get("firstChild").onceAfter("load", function(e) {
                this.fire("loaded");
            }, this);
        },
        destructor: function() {
            if (this.imgEvent) {
                this.imgEvent.detach();
            }
        }
    }, {
        /**
         * @lends Y.Wegas.SimpleElement
         */
        EDITORNAME: "Simple Element",
        ATTRS: {
            contentType: {
                value: "text",
                type: "string",
                choices: [{
                        value: "text",
                        label: 'Text'
                    }, {
                        value: "img",
                        label: 'Image url'
                    }],
                _inputEx: {
                    label: "Type"
                }
            },
            content: {
                value: "",
                type: "string"
            },
            response: {
                value: undefined,
                type: "string",
                optional: true,
                getter: function(val) {
                    if (val === "") {
                        return undefined;       // so this attr wont appear in serialization
                    } else {
                        return val;
                    }
                }
            }
        }
    });
});

