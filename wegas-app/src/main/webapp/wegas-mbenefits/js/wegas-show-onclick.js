/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */



YUI.add('wegas-show-onclick', function(Y) {
    "use strict";

    var EXPANDED_CSS_CLASS = "show-onclick--targets_visible";

    var ShowOnClick = Y.Base.create("wegas-show-onclick", Y.Plugin.Action, [], {
        initializer: function() {
            this.hidden = false;
            if (this.get("hideByDefault")) {
                Y.later(0, this, this.hideTargets);
            } else {
                Y.later(0, this, this.showTargets);
            }
        },
        hideTargets: function() {
            Y.all(this.get("nodeSelector")).each(function(node) {
                var widget = Y.Widget.getByNode(node);
                widget.hide();
                if (this.get("harmonizeHeights")) {
                    node.setStyle("height", null);
                }
            }, this);

            this.get("host").get("contentBox").removeClass(EXPANDED_CSS_CLASS);
            this.hidden = true;
        },
        showTargets: function() {
            var maxHeight = 0;
            var nodes = Y.all(this.get("nodeSelector"));

            this.get("host").get("contentBox").addClass(EXPANDED_CSS_CLASS);

            nodes.each(function(node) {
                var widget = Y.Widget.getByNode(node);
                widget.show();
                maxHeight = Math.max(maxHeight, node.getDOMNode().getBoundingClientRect().height);
            }, this);

            if (this.get("harmonizeHeights")) {
                nodes.each(function(node) {
                    node.setStyle("height", maxHeight);
                }, this);
            }

            this.hidden = false;


            if (this.get("hideMode") === "anyclick") {
                Y.later(0, this, function() {
                    // Y.later, otherwise, this very click events is catch 
                    Y.one("body").once("click", this.hideTargets, this);
                });
            }
        },
        execute: function() {
            if (this.hidden) {
                this.showTargets();
            } else {
                this.hideTargets();
            }
        }
    }, {
        NS: 'ShowOnClick',
        ATTRS: {
            nodeSelector: {
                type: "string",
                value: "",
                view: {
                    label: "nodes selector",
                    description: "Widget(s) CSS Selector"
                }
            },
            hideByDefault: {
                type: "boolean",
                value: false,
                view: {
                    label: "Hide by default"
                }
            },
            hideMode: {
                type: "string",
                value: "anyclick",
                view: {
                    type: "select",
                    label: "Hide Mode",
                    description: "Once shown, how to hide again",
                    choices: [{
                            value: "anyclick",
                            label: "Any click anywhere"
                        }, {
                            value: "hostclick",
                            label: "Click on host only"
                        }
                    ]
                }
            },
            harmonizeHeights: {
                type: "boolean",
                value: false,
                view: {
                    label: "Harmonize Heights",
                    description: "Harmonized displayed nodes heights"
                }
            }
        }
    });

    Y.Plugin.ShowOnClick = ShowOnClick;
});