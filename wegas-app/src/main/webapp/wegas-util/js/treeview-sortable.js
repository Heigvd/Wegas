/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("treeview-sortable", function(Y) {
    "use strict";

    var HOST = "host", NODE = "node", CONTENTBOX = 'contentBox',
        TreeViewSortable;
        
    /*
     * Plugin used to change order of treeview elements. 
     */
    TreeViewSortable = Y.Base.create("treeview-sortable", Y.Plugin.Base, [], {
        initializer: function() {
            // Vérifie que le plugin est bien branché sur un widget treeview. 
            if (!(this.get(HOST) instanceof Y.TreeView)) {
                Y.log("TreeView sortable host must be a TreeView", "warn", "TreeViewSortable");
                return;
            }
            
            // Add logic after host (treeview) "render" method.
            this.afterHostEvent("render", function() {
                var cb = this.get(HOST).get(CONTENTBOX);
                    
                cb.setStyles({
                    overflowY: "auto",
                    overflowX: "hidden"
                });

                this.sortable = new NestedSortable({
                    container: cb,
                    nodes: 'li.treeview-draggable',
                    opacity: '.2',
                    invalid: ".wegas-editor-dummy",
                    moveType: "insert"
                        // handles: ['.yui3-treenode-content-icon', '.yui3-treeleaf-content-icon']
                        // opacityNode: "dragNode",
                });
                this.sortable.treeSortPlg = this;

                this.sortable.delegate.on('drag:enter', function(e) {
                    var drop = e.drop.get('node');
                }, this);

                this.sortable.delegate.after('drag:end', function(ev) {
                    var node = this.sortable.delegate.get('currentNode'),
                        prev = node.previous(),
                        dragWidget = Y.Widget.getByNode(node),
                        dropNode = node.get("parentNode"),
                        dropWidget = Y.Widget.getByNode(dropNode),
                        index = dropNode.get("children").indexOf(node),
                        targetNode = ev.target.get(NODE);
                    targetNode.removeAttribute("style");// DD somewhere sets some element styles, which mess up alignment somewhere in IE

                    if (prev !== null) {
                        if (prev.hasClass("wegas-editor-dummy")) {
                            index -= 1;
                        }
                    }
                    
                    dropWidget.add(dragWidget, index);
                    // Update treeview
                    this.fire("sort", {
                        dragWidget: dragWidget,
                        dropWidget: dropWidget,
                        index: index
                    }); // Fire sorted event
                    this.sync(); // Sync dummies
                }, this);

            });
            this.afterHostMethod("syncUI", this.sync);
            this.afterHostEvent(["*:collapsedChange"], this.sync);
            this.bind();
        },
        sync: function() {
            var cb = this.get(HOST).get(CONTENTBOX),
                nodeGroups = this.get("nodeGroups");
            cb.all(".wegas-editor-dummy").each(function(n) {                    // Remove useless dummies
                if (n.ancestor("ul").get("children").size() > 1) {
                    n.remove(true);
                }
            });
            Y.Array.each(nodeGroups, function(item) {
                cb.all("." + item.nodeClass).addClass("treeview-draggable");    // Add class to all draggable nodes
                cb.all(item.parentNode + " ul:empty").each(function(emptyUL) {
                    var emptyLI = Y.Node.create("<li class=\"yui3-widget treeview-draggable yui3-treenode wegas-editor-dummy " + item.nodeClass + " \"><div class=\"content-header yui3-treenode-content-header\"><span class=\"yui3-treenode-content-label\" ><i>empty</i></span></div></li>");
                    emptyUL.append(emptyLI);
                });
            });
            this.sortable.sync();
        },
        bind: function() {
            this.afterHostEvent("*:addChild", function(e) {
                var parent = e.target, child = e.child, dummy;
                if(child.name === "treenode"){
                    child.get("boundingBox").addClass("treeview-draggable");
                }
                if (parent.size() === 1) {
                    dummy = parent.get("contentBox").one(".wegas-editor-dummy");
                    if (dummy) {
                        dummy.remove(true);
                    }
                }
            });
            this.afterHostEvent("*:removeChild", function(e) {
                var parent = e.target, emptyLI;
                if (parent.size() === 0) {
                    var emptyLI = Y.Node.create("<li class=\"yui3-widget treeview-draggable yui3-treenode wegas-editor-dummy wegas-editor-listitem \"><div class=\"content-header yui3-treenode-content-header\"><span class=\"yui3-treenode-content-label\" ><i>empty</i></span></div></li>");
                    parent.get("contentBox").append(emptyLI);
                }
            });
        },
        testGroups: function(dragNode, dropNode) {
            var groups = this.get("nodeGroups");
            if (groups) {
                return !!Y.Array.find(groups, function(item) {  // Added custom class mathing for node groups
                    return dragNode.hasClass(item.nodeClass) && dropNode.hasClass(item.nodeClass);
                });
            }
            return false;
        },
        testDrag: function(dragNode) {
            var groups = this.get("nodeGroups");
            if (groups) {
                return !!Y.Array.find(groups, function(item) {
                    return dragNode.hasClass(item.nodeClass);
                });
            }
            return false;
        },
        destructor: function() {
            this.sortable.destroy();
        }
    }, {
        NAME: "TreeViewSortable",
        NS: "sortable",
        ATTRS: {
            /*
             * Defines groups of items to be moved and items on which they can be dropped, even when they are empty.
             */
            nodeGroups: {
                value: [{
                        nodeClass: "yui3-widget",
                        parentNode: ".yui3-widgget"
                    }]
            }
        }
    });
    Y.Plugin.TreeViewSortable = TreeViewSortable;

    /**
     * Extend so in works with nested lists
     * 
     * @returns {undefined}
     */
    function NestedSortable() {
        NestedSortable.superclass.constructor.apply(this, arguments);
    }
    Y.extend(NestedSortable, Y.Sortable, {
        _onDropEnter: function(e) {
            if (this.treeSortPlg.testGroups(e.drag.get(NODE), e.drop.get(NODE))) {
                NestedSortable.superclass._onDropEnter.apply(this, e);
            }
        },
        _onDragOver: function(e) {
            var dragNode = e.drag.get(NODE),
                dropNode = e.drop.get(NODE);
            if (!this.treeSortPlg.testGroups(dragNode, dropNode)) {
                return;
            }
            // is drop a child of drag?  - this is the bit that's added:
            if (e.drag.get(NODE).contains(e.drop.get(NODE))) {
                return;
            }
            NestedSortable.superclass._onDragOver.call(this, e);
        }
    });
});