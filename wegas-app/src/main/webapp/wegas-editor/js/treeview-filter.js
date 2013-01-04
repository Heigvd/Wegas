/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
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
        filter: function(item, matcher) {
            var matches = false, i;
            if (item instanceof Y.TreeView) {
                matches = false;
            } else {
                for (i in this.get("searchAttrs")) {
                    try {
                        matches = matches || (item.get(this.get("searchAttrs")[i]).indexOf(matcher) > -1);
                    } catch (e) {
                        //SearchAttrs fail
                    }
                }
            }
            if (item.each) {
                item.each(function(node) {
                    this.filter(node, matcher);
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
            searchVal: {
                value: ""
            },
            searchAttrs: {
                value: ["label"]
            }
        }
    });

    Y.namespace("Plugin").TreeViewFilter = TreeViewFilter;
});
