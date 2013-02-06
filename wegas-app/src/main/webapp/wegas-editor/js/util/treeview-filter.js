/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
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
            var matches = false, i,
                    matcher;
            if (item instanceof Y.TreeView) {
                matches = false;
            } else {
                if (this.get("regExp")) {
                    try {
                        matcher = new RegExp(match);
                    } catch (e) {
                        return;
                    }
                    for (i in this.get("searchAttrs")) {
                        try {
                            matches = matches || matcher.test(item.get(this.get("searchAttrs")[i]));
                        } catch (e) {
                            //SearchAttrs fail
                        }
                    }
                } else {
                    for (i in this.get("searchAttrs")) {
                        try {
                            matches = matches || (item.get(this.get("searchAttrs")[i]).toLowerCase().indexOf(match.toLowerCase()) > -1);
                        } catch (e) {
                            //SearchAttrs fail
                        }
                    }
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
            searchVal: {
                value: ""
            },
            searchAttrs: {
                value: ["label"]
            },
            regExp: {
                value: false,
                validator: Y.Lang.isBoolean
            }
        }
    });

    Y.namespace("Plugin").TreeViewFilter = TreeViewFilter;
});
