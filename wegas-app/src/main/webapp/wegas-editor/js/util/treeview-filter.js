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
            this.after("searchValChange", function(e) {
                if (e.prevVal !== e.newVal) {
                    this.doFilter(this.get("host"), e.newVal);
                }
            });

            this.afterHostEvent("*:addChild", function(e) {
                this.doFilter(this.get("host"), this.get("searchVal"));
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
                    this.filter(node, match);
                }, this);
            }
            if (matches) {
                item.get("boundingBox").addClass("filter-match").removeClass("filter-no-match").removeClass("filter-sub-match");
            } else if (item.get("boundingBox").one(".filter-match")) {
                item.get("boundingBox").addClass("filter-sub-match").removeClass("filter-no-match").removeClass("filter-match");
                if (item.expand) {
                    item.expand(false);
                }
            } else {
                item.get("boundingBox").addClass("filter-no-match").removeClass("filter-match").removeClass("filter-sub-match");
            }
            return matches;

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
                value: "Nothing matches filter's criteria",
                validator: Y.Lang.isString
            }
        }
    });

    Y.namespace("Plugin").TreeViewFilter = TreeViewFilter;
});
