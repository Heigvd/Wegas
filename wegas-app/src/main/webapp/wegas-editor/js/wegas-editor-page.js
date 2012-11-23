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

YUI.add('wegas-editor-page', function(Y) {
    var PageEditor, CONTENT_BOX = "contentBox", BOUNDING_BOX = "boundingBox";
    PageEditor = Y.Base.create("wegas-editor-page", Y.Widget, [Y.WidgetChild], {
        initializer: function() {
            this.dataSource = Y.Wegas.PageFacade.rest;
            this.plug(Y.Plugin.WidgetToolbar);
        },
        renderUI: function() {
            this.tw = new Y.TreeView({
                render: this.get(CONTENT_BOX)
            });
            this.toolbar.add(new Y.Button({
                label: "New Page",
                on: {
                    click: function() {
                        this.fire("newPage");
                    }
                }
            }));
        },
        syncUI: function() {
            this.dataSource.getIndex(Y.bind(this.buildIndex, this));
        },
        bindUI: function() {
            this.on("*:newPage", function(e) {
                this.dataSource.post({"type": "List"});
            });
            this.tw.on("treenode:click", function(e) {
                var node = e.node, widget;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data")["page"]) {
                    this.get("pageLoader").set("pageId", node.get("data")["page"]);
                }
            }, this);
            this.dataSource.after("pageUpdated", this.syncUI, this);
            this.get("pageLoader").after("pageIdChange", this.syncUI, this);
        },
        buildWidgetTree: function(node) {
            var widget = this.get("pageLoader").get("widget");
            this.cleanAllChildren();
            node.removeAll();
            this.buildSubTree(node, widget);
            node.expand(false);
        },
        buildSubTree: function(node, widget) {
            var treeNode;
            if (widget instanceof Y.Wegas.List) {
                treeNode = new Y.TreeNode({
                    label: "List",
                    data: {
                        widget: widget
                    }
                });
                node.add(treeNode);
                widget.each(function(item, index) {
                    this.buildSubTree(treeNode, item);
                }, this);
//                for (var i in widget["children"]) {
//                    this.buildSubTree(treeNode, widget["children"][i]);
//                }
            } else {
                node.add(new Y.TreeLeaf({
                    label: "Widget: " + widget.constructor.NAME,
                    data: {
                        widget: widget
                    }
                }));
            }
        },
        buildIndex: function(index) {
            var i, page = this.get("pageLoader").get("pageId"),
                    node,
                    widget = this.get("pageLoader").get("widget");
            this.tw.removeAll();
            for (i in index) {
                node = new Y.TreeNode({
                    label: "Page: " + index[i] + " (" + i + ")",
                    data: {
                        page: i
                    }
                });
                this.tw.add(node);
                if (+i === +page) {
                    this.buildSubTree(node, widget);
                    node.expand(false);
                }
            }
        },
        cleanAllChildren: function() {
            for (var i in this.tw._items) {
                this.tw._items[i].collapse(false);
                //this.tw._items[i].removeAll();
            }
        },
        destructor: function() {
            this.tw.destroy();
        }
    }, {
        ATTRS: {
            pageLoader: {
                value: "previewPageLoader",
                getter: function(v) {
                    return Y.Wegas.PageLoader.find(v);
                }
            }
        }
    });
    Y.namespace("Wegas").PageTreeview = PageEditor;
});