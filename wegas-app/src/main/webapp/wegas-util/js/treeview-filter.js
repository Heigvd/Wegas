/*
 * Wegas
 * http://wegas.albasim.ch
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
            this.after(["searchValChange", "testFnChange"], function(e) {
                if (e.prevVal !== e.newVal) {
                    this.doFilter(this.get("host"), this.get("searchVal"));
                }
            });

            this.afterHostEvent(["*:addChild", "render"], function(e) {
                this.doFilter(this.get("host"), this.get("searchVal"));
            });
        },
        filter: function(item, match) {
            var matches = false, subMatch = false;

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
                    subMatch = this.filter(node, match) || subMatch;
                }, this);
            }
            item.get("boundingBox").removeClass("filter-match").removeClass("filter-no-match").removeClass("filter-sub-match");
            if (matches) {
                item.get("boundingBox").addClass("filter-match");
//                if (!subMatch && match && item.collapse) {
//                    item.collapse(false);
//                }
            }
            if (subMatch) {
                item.get("boundingBox").addClass("filter-sub-match");
                if (match && item.expand) {
                    item.expand(false);
                }
            }
            if (!matches && !subMatch) {
                item.get("boundingBox").addClass("filter-no-match");
            }
            return matches || subMatch;

        },
        doFilter: function(item, match) {
            this.filter(item, match);
            item.get("contentBox").all(".filter-empty").remove(true);
            if (!item.get("boundingBox").hasClass("filter-sub-match") && item.size() > 0) {
                item.get("contentBox").append("<div class='wegas-smallmessage filter-empty'>" + this.get("emptyMsg") + "</div>");
            }
        },
        destructor: function() {
            this.get("host").get("contentBox").all(".filter-empty").remove(true);
        }

    }, {
        NAME: "TreeViewFilter",
        NS: "filter",
        ATTRS: {
            /**
             * A function to test current processed node.
             * Executed in current node's context (this = current node)
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
            },
            emptyMsg: {
                value: "There are no records that match your search",
                validator: Y.Lang.isString
            }
        }
    });

    Y.Plugin.TreeViewFilter = TreeViewFilter;
});
