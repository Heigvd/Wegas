/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add("treeview-filter", function(Y) {
    "use strict";

    var TreeViewFilter = Y.Base.create("treeview-filter", Y.Plugin.Base, [], {
        initializer: function() {
            if (!(this.get("host") instanceof Y.TreeView)) {
                Y.log("TreeView filter host must be a TreeView", "warn", "TreeViewFilter");
                return;
            }
            this.after("searchValChange", function(e) {
                if (e.prevVal !== e.newVal) {
                    this.filter(this.get("host"), e.newVal);
                }
            });

            this.afterHostEvent("*:addChild", function(e) {
                this.filter(this.get("host"), this.get("searchVal"));
            });
        },
        filter: function(item, match) {
            var matches = false;
            if (item instanceof Y.TreeView) {
                matches = false;
            } else {
                try {
                    matches = this.get("testFn").call(item, match) === true;
                } catch (e) {
                }

            }
            if (item.each) {
                item.each(function(node) {
                    if (this.filter(node, match) && item.expand) {
                        item.expand(false);
                    }
                }, this);
            }
            if (matches || item.get("boundingBox").one(".filter-match")) {
                item.get("boundingBox").addClass("filter-match");
                item.get("boundingBox").removeClass("filter-no-match");
            } else {
                item.get("boundingBox").addClass("filter-no-match");
                item.get("boundingBox").removeClass("filter-match");
            }
            return matches;

        },
        destructor: function() {

        }

    }, {
        NAME: "TreeViewFilter",
        NS: "filter",
        ATTRS: {
            /**
             * A function to test current processed node.
             * Executed in current node's scope (this = current node)
             * @param {Any} SearchVal the given searchVal ATTRS
             */
            testFn: {
                value: function(searchVal) {
                    return true;
                },
                validator: Y.Lang.isFunction
            },
            searchVal: {
                value: ""
            }
        }
    });

    Y.namespace("Plugin").TreeViewFilter = TreeViewFilter;
});
