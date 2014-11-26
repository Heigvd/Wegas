/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
     * Plugin permettant de changer l'order des éléments d'un treeview. 
     */
    TreeViewSortable = Y.Base.create("treeview-sortable", Y.Plugin.Base, [], {
        initializer: function() {
            // Vérifie que le plugin est bien branché sur un widget treeview. 
            if (!(this.get(HOST) instanceof Y.TreeView)) {
                Y.log("TreeView sortable host must be a TreeView", "warn", "TreeViewSortable");
                return;
            }
            
            // Ajoute de la logique après le "render" de l'hote (treeview).
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

                this.nodeSelecter = {
                    'inside':false,
                    'timer':null,
                    'dropWidget':null
                };
                
                this.sortable.delegate.on('drag:enter', function(e) {
                    var drop = e.drop.get('node');
                    this.nodeSelecter.inside = false;
                    if(this.nodeSelecter.timer !== null){
                        this.nodeSelecter.timer.cancel();
                    }
                    if(this.nodeSelecter.dropWidget !== null){
                        this.nodeSelecter.dropWidget.removeClass("yui3-dd-in");
                    }
                    if(drop.hasClass("yui3-treenode-collapsed") && !drop.hasClass("wegas-editor-question")){
                        this.nodeSelecter.dropWidget = drop;
                        this.nodeSelecter.timer = Y.later(1000, this, this._flagInsideNode, [drop]);
                    }
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
                    
                    if(this.nodeSelecter.inside){
                        dropNode = this.nodeSelecter.dropWidget;
                        dropWidget = Y.Widget.getByNode(dropNode);
                        dropWidget.fire("toggleClick", {
                            node: dropNode
                        });
                        this.nodeSelecter.inside = false;
                    }
                    if(this.nodeSelecter.timer !== null){
                        this.nodeSelecter.timer.cancel();
                    }
                    if(this.nodeSelecter.dropWidget !== null){
                        this.nodeSelecter.dropWidget.removeClass("yui3-dd-in");
                        this.nodeSelecter.dropWidget = null;
                    }
                    if(prev !== null){
                        if(prev.hasClass("wegas-editor-dummy")){
                            index--;
                        }
                    }
                    // Update treeview
                    this.fire("sort", {
                        dragWidget: dragWidget,
                        dropWidget: dropWidget,
                        index: index
                    }); // Fire sorted event
                    this.sync(); // Sync dummies
                }, this);
                
                this._flagInsideNode = function(drop) {
                    if(this.nodeSelecter.timer !== null){
                        this.nodeSelecter.timer.cancel();
                    }
                    var widgetDrop = Y.Widget.getByNode(drop);
                    if (widgetDrop !== null && widgetDrop.size() > 0) {
                        if(this.nodeSelecter.dropWidget !== null){
                            this.nodeSelecter.dropWidget.addClass("yui3-dd-in");
                        }
                        this.nodeSelecter.inside = true;
                    }
                };
            });
            this.afterHostMethod("syncUI", this.sync);
            this.afterHostEvent(["*:collapsedChange"], this.sync);
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
                cb.all(item.parentNode + " ul:empty").each(function(ulVide) {
                    var emptyLI = Y.Node.create("<li class=\"yui3-widget treeview-draggable yui3-treenode wegas-editor-dummy " + item.nodeClass + " \"><div class=\"content-header yui3-treenode-content-header\"><span class=\"yui3-treenode-content-label\" ><i>empty</i></span></div></li>");
                    ulVide.append(emptyLI);
                });
            });
            this.sortable.sync();
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