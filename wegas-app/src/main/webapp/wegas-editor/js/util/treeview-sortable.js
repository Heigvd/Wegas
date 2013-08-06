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

    var HOST = "host",
            NODE = 'node',
            PARENT_NODE = 'parentNode',
            NODES = 'nodes',
            CONTENTBOX = 'contentBox',
            TreeViewSortable;

    TreeViewSortable = Y.Base.create("treeview-sortable", Y.Plugin.Base, [], {
        initializer: function() {
            if (!(this.get(HOST) instanceof Y.TreeView)) {
                Y.log("TreeView filter host must be a TreeView", "warn", "TreeViewFilter");
                return;
            }

            this.afterHostEvent("render", function() {
                var host = this.get(HOST),
                        cb = host.get(CONTENTBOX);

                cb.setStyles({
                    overflowY: "auto",
                    overflowX: "hidden"
                });

                this.sortable = new NestedSortable({
                    container: cb,
                    nodes: 'li',
                    opacity: '.2',
                    invalid: ".wegas-editor-dummy"
                            // handles: ['.yui3-treenode-content-icon', '.yui3-treeleaf-content-icon']
                });
                this.sortable.nodeGroups = this.get("nodeGroups");
                this.sortable.delegate.dd.plug(Y.Plugin.DDNodeScroll, {
                    node: cb,
                    horizontal: false
                });
                //this.sortable.delegate.dd.after('drag:over', this.syncDummies, this);
                this.sortable.delegate.dd.after('drag:end', this.onDragEnd, this);
            });
            this.afterHostMethod("syncUI", this.syncDummies, this);
        },
        onDragEnd: function(e) {
            var node = this.sortable.delegate.get('currentNode'),
                    //  prev = node.previous(), next = node.next(),
                    dragWidget = Y.Widget.getByNode(node),
                    dropNode = node.get("parentNode"),
                    dropWidget = Y.Widget.getByNode(dropNode),
                    index = dropNode.get("children").indexOf(node);

            Y.log("onDragEnd()", "info", "Wegas.VariableTreeView");

            dropWidget.add(dragWidget, index);                                  // Update treeview
            this.fire("sort", {
                dragWidget: dragWidget,
                dropWidget: dropWidget,
                index: index
            });                                                                 // Fire sorted event
            this.syncDummies();
        },
        syncDummies: function() {
            var cb = this.get(HOST).get(CONTENTBOX), i,
                    nodeGroups = this.get("nodeGroups");
            cb.all(".wegas-editor-dummy").remove(true);
            for (i = 0; i < nodeGroups.length; i += 1) {                       // Add dummies to allow drag on empty nodes
                cb.all(nodeGroups[i].parentNode + " ul:empty")
                        .append("<li class=\"wegas-editor-dummy " + nodeGroups[i].nodeClass + " \">empty</li>");
            }
            this.sortable.sync();
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

    Y.namespace("Plugin").TreeViewSortable = TreeViewSortable;

    /**
     * Extend so in works with nested lists
     *
     * @returns {undefined}
     */
    function NestedSortable() {
        NestedSortable.superclass.constructor.apply(this, arguments);
    }
    Y.extend(NestedSortable, Y.Sortable, {
        _onDragOver: function(e) {

            var i,
                    found = false,
                    dragNode = e.drag.get(NODE),
                    dropNode = e.drop.get(NODE);

            if (this.nodeGroups) {
                for (i = 0; i < this.nodeGroups.length; i += 1) {               // Added custom class mathing for node groups
                    found = found || (dragNode.test("." + this.nodeGroups[i].nodeClass) && dropNode.test("." + this.nodeGroups[i].nodeClass));
                }
                if (!found) {
                    return;
                }
            }

            if (!e.drop.get(NODE).test(this.get(NODES))) {
                return;
            }
            if (dragNode == e.drop.get(NODE)) {
                return;
            }

            if (dragNode.contains(e.drop.get(NODE))) {                          // is drop a child of drag?  - this is the bit that's added:
                return;
            }

            switch (this.get('moveType').toLowerCase()) {
                case 'insert':
                    var dir = ((this._up) ? 'before' : 'after');
                    e.drop.get(NODE).insert(e.drag.get(NODE), dir);
                    break;
                case 'swap':
                    Y.DD.DDM.swapNode(e.drag, e.drop);
                    break;
                case 'move':
                case 'copy':
                    var dropsort = Y.Sortable.getSortable(e.drop.get(NODE).get(PARENT_NODE)),
                            oldNode, newNode;

                    if (!dropsort) {
                        Y.log('No delegate parent found', 'error');
                        return;
                    }

                    Y.DD.DDM.getDrop(e.drag.get(NODE)).addToGroup(dropsort.get(ID));

                    //Same List
                    if (e.drag.get(NODE).get(PARENT_NODE).contains(e.drop.get(NODE))) {
                        Y.DD.DDM.swapNode(e.drag, e.drop);
                    } else {
                        if (this.get('moveType') === 'copy') {
                            //New List
                            oldNode = e.drag.get(NODE);
                            newNode = oldNode.cloneNode(true);

                            newNode.set(ID, '');
                            e.drag.set(NODE, newNode);
                            dropsort.delegate.createDrop(newNode, [dropsort.get(ID)]);
                            oldNode.setStyles({
                                top: '',
                                left: ''
                            });
                        }
                        e.drop.get(NODE).insert(e.drag.get(NODE), 'before');
                    }
                    break;
            }
        }
    });
});
