/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add("treeview-filter", function(Y) {
    "use strict";

    var filter = function(filterFn, item, match) {
            var matches = false,
                subMatch = false;

            if (item instanceof Y.TreeView) {
                matches = false;
            } else {
                matches = filterFn.call(item, match) === true;
            }

            if (item.each) {
                item.each(function(node) {
                    subMatch = filter(filterFn, node, match) || subMatch;
                }, this);
            }

            item.get("boundingBox").removeClass("filter-match").removeClass("filter-no-match").removeClass("filter-sub-match");

            if (!match) {
                return;
            }

            if (matches) {
                item.get("boundingBox").addClass("filter-match");
                //                if (!subMatch && match && item.collapse) {
                //                    item.collapse(false);
                //                }
            } else if (!subMatch) {
                item.get("boundingBox").addClass("filter-no-match");
            }
            if (subMatch) {
                item.get("boundingBox").addClass("filter-sub-match");
                if (item.expand) {
                    item.expand(false);
                }
            }
            return matches || subMatch;

        },
        TreeViewFilter = Y.Base.create("treeview-filter", Y.Plugin.Base, [], {
            initializer: function() {
                this.timer = null;
                if (!(this.get("host") instanceof Y.TreeView)) {
                    Y.log("TreeView filter host must be a TreeView", "warn", "TreeViewFilter");
                    return;
                }
                this.after(["searchValChange", "testFnChange"], function(e) {
                    if (this.timer && this.timer.cancel) {
                        this.timer.cancel();
                    }
                    this.timer = Y.later(20, this, function() {
                        this.doFilter(this.get("testFn"), this.get("searchVal"));
                    });
                });

                this.afterHostEvent(["*:addChild", "render"], function(e) {
                    //delay as addChild may occure often
                    if (this.timer && this.timer.cancel) {
                        this.timer.cancel();
                    }
                    this.timer = Y.later(20, this, function() {
                        this.doFilter(this.get("testFn"), this.get("searchVal"));
                    });
                });
            },
            doFilter: function(filterFn, match) {
                var item = this.get("host");
                filter(filterFn, item, match);
                item.get("contentBox").all(".filter-empty").remove(true);
                if (match && !item.get("boundingBox").hasClass("filter-sub-match") && item.size() > 0) {
                    item.get("contentBox").append("<div class='wegas-smallmessage filter-empty'>" + this.get("emptyMsg") + "</div>");
                }
            },
            destructor: function() {
                if (this.timer && this.timer.cancel) {
                    this.timer.cancel();
                }
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
                    value: "",
                    validator: Y.Lang.isString
                },
                emptyMsg: {
                    value: "There are no records that match your search",
                    validator: Y.Lang.isString
                }
            }
        });

    Y.Plugin.TreeViewFilter = TreeViewFilter;
});
