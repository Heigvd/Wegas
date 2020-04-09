/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/* global YUI */
YUI.add("treeview-sortable", function(Y) {
    "use strict";

    var HOST = "host",
        BOUNDINGBOX = 'boundingBox',
        TreeViewSortable,
        CLASSES = {
            move: "yui3-sortable-widget"
        },
        UPDATE_TYPE = {
            AFTER: 'after',
            BEFORE: 'before',
            APPEND: 'append',
            PREPEND: 'prepend'
        },
        sortModule,
        isDescendant;

    isDescendant = function(parent, child) {
        var curr = child;
        while (curr) {
            if (curr === parent) {
                return true;
            }
            curr = curr.get("parent");
        }
        return false;
    };
    sortModule = function(host, callback, cfg) {
        var moveWidget,
            tmpHandles = [],
            handles = [],
            lastXY,
            start = {};

        function init() {
            handles.push(host.get(BOUNDINGBOX).delegate("mousedown", function(mdevent) {
                mdevent.halt(true);
                lastXY = [mdevent.pageX, mdevent.pageY];
                startDrag(mdevent.currentTarget);
            }, Y.Array.reduce(cfg.nodeGroups, "", function(prev, next) {
                return prev + (prev ? ", " : "") + "." + next.nodeClass;
            })));

        }

        function validateDrop(node, target) {
            var groups = cfg.nodeGroups;
            return Y.Array.reduce(groups, false, function(prev, next) {
                    if (next.parentNode instanceof Array) {
                        return prev || Y.Array.reduce(next.parentNode, false, function(last, curr) {
                                return last || node.get(BOUNDINGBOX).hasClass(next.nodeClass)
                                               && target && target.get(BOUNDINGBOX).hasClass(curr);
                            });
                    } else {
                        return prev || node.get(BOUNDINGBOX).hasClass(next.nodeClass)
                                       && target && target.get(BOUNDINGBOX).hasClass(next.parentNode);
                    }
                }) && cfg.validator(node, target);
        }

        function update(widget, atWidget, position) {
            // console.log(widget.get("label"), atWidget.get("label"), position);
            switch (position) {
                case UPDATE_TYPE.AFTER:
                    if (!validateDrop(widget, widget.get("parent"))) {
                        return false;
                    }
                    if (widget.get("parent") === atWidget.get("parent") &&
                        widget.get("index") < atWidget.get("index")) {
                        atWidget.get("parent").add(widget, atWidget.get("index"));
                    } else {
                        atWidget.get("parent").add(widget, atWidget.get("index") + 1);
                    }
                    return true;
                case UPDATE_TYPE.BEFORE:
                    if (!validateDrop(widget, atWidget.get("parent"))) {
                        return false;
                    }
                    atWidget.get("parent").add(widget, atWidget.get("index"));
                    return true;
                case UPDATE_TYPE.APPEND:
                    if (!validateDrop(widget, atWidget)) {
                        return false;
                    }
                    atWidget.add(widget);
                    return true;
                case UPDATE_TYPE.PREPEND:
                    if (!validateDrop(widget, atWidget)) {
                        return false;
                    }
                    atWidget.add(widget, 0);
                    return true;
            }
        }

        function nextSibling(widget) {
            var index = widget.get("index");
            if (index < widget.get("parent").size() - 1) {
                return widget.get("parent").item(index + 1);
            }
            return null;
        }

        function prevSibling(widget) {
            var index = widget.get("index");
            if (index === 0) {
                return null;
            }
            return widget.get("parent").item(index - 1);
        }

        function startDrag(node) {
            var BB = host.get(BOUNDINGBOX);
            var rect = BB.get("region");
            var scrollTimer;
            moveWidget = Y.Widget.getByNode(node);
            start = {
                parent: moveWidget.get("parent"),
                index: moveWidget.get("index")
            };
            tmpHandles.push(BB.on("mousemove", function(mmEvent) {
                mmEvent.halt(true);
                drag(mmEvent);
            }));
            tmpHandles.push(Y.on("mouseup", function() {
                if (!moveWidget ||
                    (moveWidget.get("parent") === start.parent && moveWidget.get("index") === start.index)) {
                    reset();
                } else {
                    commit();
                }
            }));
            /*
             Scroll management
             */
            tmpHandles.push(BB.on("mouseleave", function(e) {
                var deltaScroll = 5;
                scrollTimer = Y.later(20, null, function() {
                    if (e.pageX > rect.right) {
                        BB.getDOMNode().scrollLeft += deltaScroll;
                    } else if (e.pageX < rect.left) {
                        BB.getDOMNode().scrollLeft -= deltaScroll;
                    }
                    if (e.pageY > rect.bottom) {
                        BB.getDOMNode().scrollTop += deltaScroll;
                    } else if (e.pageY < rect.top) {
                        BB.getDOMNode().scrollTop -= deltaScroll;
                    }
                }, [], true);
                tmpHandles.push(scrollTimer);
            }));
            tmpHandles.push(BB.on("mouseenter", function() {
                if (scrollTimer && scrollTimer.cancel) {
                    scrollTimer.cancel();
                }
            }));
        }

        function drag(ev) {
            /* Cases
             (0)
             -----
             ->>>>DRAG<<<<
             -----

             (1)
             -----
             |->>>>DRAG<<<<

             (2)
             -----
             |----
             |->>>>DRAG<<<<
             -----

             (3)
             -----
             |---
             ->>>>DRAG<<<<
             */
            var pos = [ev.pageX, ev.pageY];
            var moved = false;
            var diffY = pos[1] - lastXY[1];
            var diffX = pos[0] - lastXY[0];
            var tmp;
            var over = Y.Widget.getByNode(ev.target);
            if(!moveWidget.get(BOUNDINGBOX).hasClass(CLASSES.move)){
                // Move at least 10px to enable drag
                if(diffX * diffX + diffY * diffY < 100){ 
                    return;
                }
                moveWidget.get(BOUNDINGBOX).addClass(CLASSES.move);
            }
            if (!over || over instanceof Y.TreeView) {
                return;
            }
            if (diffX > 20) { //right
                tmp = prevSibling(moveWidget);
                if (tmp && tmp.size && !tmp.get("collapsed") && validateDrop(moveWidget, tmp)) {
                    moved = update(moveWidget, tmp, UPDATE_TYPE.APPEND);
                }
            } else if (diffX < -20) { //left
                tmp = nextSibling(moveWidget);
                if (!tmp && validateDrop(moveWidget, moveWidget.get("parent").get("parent"))) {
                    moved = update(moveWidget, moveWidget.get("parent"), UPDATE_TYPE.AFTER);
                }
            }
            if (isDescendant(moveWidget, over)) {
                return;
            }
            if (diffY > 5 && !isDescendant(over, moveWidget)) { //down
                if (over.size && !over.get("collapsed") && validateDrop(moveWidget, over)) {
                    moved = update(moveWidget, over, UPDATE_TYPE.PREPEND);
                } else if (validateDrop(moveWidget, over.get("parent"))) {
                    moved = update(moveWidget, over, UPDATE_TYPE.AFTER);
                }
            } else if (diffY < -5) { //up
                if (over.size && !over.get("collapsed") && !isDescendant(over, moveWidget) &&
                    validateDrop(moveWidget, over)) {
                    moved = update(moveWidget, over, UPDATE_TYPE.APPEND);
                } else if (isDescendant(over, moveWidget) && over.item(0) === moveWidget ||
                           !isDescendant(over, moveWidget)) {
                    if (validateDrop(moveWidget, over.get("parent"))) {
                        moved = update(moveWidget, over, UPDATE_TYPE.BEFORE);
                    }
                }

            }

            if (moved) {
                lastXY = [ev.pageX, ev.pageY];
            }
        }

        function commit() {
            var moved = moveWidget;
            reset();
            callback({
                dragWidget: moved,
                dropWidget: moved.get("parent"),
                index: moved.get("index")
            });
        }

        function reset() {
            lastXY = null;
            Y.Array.each(tmpHandles, function(handle) {
                if (handle.detach) {
                    handle.detach();
                }
                if (handle.cancel) {
                    handle.cancel();
                }
            });
            if (moveWidget && moveWidget.get(BOUNDINGBOX)) {
                moveWidget.get(BOUNDINGBOX).removeClass(CLASSES.move);
            }
            moveWidget = null;
            tmpHandles.length = 0;
        }

        function destroy() {
            reset();
            Y.Array.each(handles, function(handle) {
                if (handle.detach) {
                    handle.detach();
                }
                if (handle.cancel) {
                    handle.cancel();
                }
            });
        }

        init();
        return {
            destroy: destroy
        };
    };

    /*
     * Plugin used to change order of treeview elements.
     */
    TreeViewSortable = Y.Base.create("treeview-sortable", Y.Plugin.Base, [], {
        initializer: function() {
            if (!Y.TreeView || !(this.get(HOST) instanceof Y.TreeView)) {
                Y.log("TreeView sortable's host must be a TreeView", "warn", "TreeViewSortable");
                return;
            }
            this.afterHostEvent("render", function() {
                this.sort = sortModule(this.get(HOST), Y.bind(this.commit, this), {
                    nodeGroups: this.get("nodeGroups"),
                    validator: this.get("validator")
                });
            });

        },
        commit: function(value) {
            this.fire("sort", value);
        },
        destructor: function() {
            if (this.sort) {
                this.sort.destroy();
            }
        }
    }, {
        NAME: "TreeViewSortable",
        NS: "sortable",
        ATTRS: {
            /*
             * Defines groups of items to be moved and items on which they can be dropped, even when they are empty. class based.
             */
            nodeGroups: {
                value: [{
                    nodeClass: "yui3-widget",
                    parentNode: ["yui3-widget"]
                }]
            },
            /*
             * function for advanced drop validation
             */
            validator: {
                value: function(widget, target) {
                    return true;
                }
            }
        }
    });
    Y.Plugin.TreeViewSortable = TreeViewSortable;

}, "2.0.0", {
    requires: ["plugin", "event", "array-extras", "yui-later"]
});
