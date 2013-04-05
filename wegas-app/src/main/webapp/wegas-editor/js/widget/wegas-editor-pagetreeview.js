/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-editor-pagetreeview', function(Y) {
    var PageEditor, PageMeta, CONTENT_BOX = "contentBox",
            BOUNDING_BOX = "boundingBox",
            NEWPAGE = (new Y.Wegas.List({type: "List"})).toObject();
    PageEditor = Y.Base.create("wegas-editor-page", Y.Widget, [Y.WidgetChild], {
        initializer: function() {
            this.dataSource = Y.Wegas.Facade.Page.cache;
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
                this.dataSource.post(NEWPAGE);
            });
            this.tw.on("treenode:click", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data")["page"]) {
                    this.get("pageLoader").set("pageId", node.get("data")["page"]);
                }
            }, this);
            this.tw.on("treenode:nodeExpanded", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data")["page"]) {
                    this.get("pageLoader").set("pageId", node.get("data")["page"]);
                }
            }, this);
            this.tw.get(CONTENT_BOX).delegate("mouseenter", function(e) {
                var node = Y.Widget.getByNode(e.target);
                e.halt(true);
                if (node.get("data.widget")) {
                    if (this.get("pageLoader").pageeditor) {
                        this.get("pageLoader").pageeditor.showOverlay(node.get("data.widget"));
                    } else {
                        node.get("data.widget").get(BOUNDING_BOX).addClass("wegas-focused-widget");
                    }
                }
            }, ".content-header", this);
            this.tw.get(CONTENT_BOX).delegate("mouseleave", function(e) {
                var node = Y.Widget.getByNode(e.target);
                e.halt(true);
                if (node.get("data.widget")) {
                    if (this.get("pageLoader").pageeditor) {
                        this.get("pageLoader").pageeditor.hideOverlay();
                    } else {
                        node.get("data.widget").get(BOUNDING_BOX).removeClass("wegas-focused-widget");
                    }
                }
            }, ".content-header", this);
            this.dataSource.after("pageUpdated", this.syncUI, this);
            this.get("pageLoader").after("pageIdChange", this.syncUI, this);
            //this.get("pageLoader").get("widget").after("*:destroy", this.syncUI, this);
        },
        buildWidgetTree: function(node) {
            var widget = this.get("pageLoader").get("widget");
            this.cleanAllChildren();
            node.removeAll();
            this.buildSubTree(node, widget);
            node.expand(false);
        },
        buildSubTree: function(node, widget) {
            var treeNode, button = new Y.Node.create("<span class=\"wegas-treeview-editmenubutton\"></span>"),
                    menuCfg = widget.getMenuCfg({
                widget: widget
            });
            button.once("click", function(e) {
                var target = Y.Widget.getByNode(e.target);
                this.plug(Y.Plugin.WidgetMenu, {
                    //           children: target.get("data.widget").getMenuCfg({widget: target.get("data.widget")})
                });
                this.menu.set("children", target.get("data.widget").getMenuCfg({widget: target.get("data.widget")}));
                this.menu.show();
            });
//            button.plug(Y.Plugin.WidgetMenu, {
//                children: menuCfg
//            });
            if (widget.each && !(widget instanceof Y.Wegas.PageLoader)) {
                treeNode = new Y.TreeNode({
                    label: "Container: " + widget.getName(),
                    rightWidget: button,
                    data: {
                        widget: widget
                    }
                });
                widget.each(function(item) {
                    this.buildSubTree(treeNode, item);
                }, this);
            } else {
                treeNode = new Y.TreeLeaf({
                    label: "Widget: " + widget.getName(),
                    rightWidget: button,
                    data: {
                        widget: widget
                    }
                });
            }
            node.add(treeNode);
        },
        buildIndex: function(index) {
            var i, page = this.get("pageLoader").get("pageId"),
                    node,
                    widget = this.get("pageLoader").get("widget"), button;
            this.tw.removeAll();
            for (i in index) {

                node = new Y.TreeNode({
                    label: "Page: " + (index[i] !== "" ? index[i] : "<i>unamed</i>") + " (" + i + ")",
                    data: {
                        page: i,
                        name: index[i]
                    }
                });
                this.tw.add(node);
                button = new Y.Node.create("<span class=\"wegas-treeview-editmenubutton\"></span>");
                button.plug(Y.Plugin.WidgetMenu, {
                    children: [{
                            type: "Button",
                            label: "Duplicate",
                            on: {
                                click: Y.bind(function(pageId) {
                                    Y.Wegas.Facade.Page.cache.duplicate(pageId, {
                                        success: Y.bind(this.buildIndex, this)
                                    });
                                }, this, i)
                            }
                        }, {
                            type: "Button",
                            label: "Delete",
                            on: {
                                click: Y.bind(function(pageId) {
                                    Y.Wegas.Facade.Page.cache.deletePage(pageId);
                                    this.destroy();
                                }, node, i)
                            }
                        }, {
                            type: "Button",
                            label: "Properties",
                            on: {
                                click: Y.bind(this.editPage, this, node.get("data"))
                            }
                        }],
                    event: "click"
                });
                node.set("rightWidget", button);
                if (+i === +page) {
                    this.buildSubTree(node, widget);
                    node.expand(false);
                }
            }
        },
        editPage: function(meta) {
            Y.Plugin.EditEntityAction.showEditForm(new PageMeta({id: meta.page, name: meta.name}), Y.bind(function(value, page) {
                Y.Plugin.EditEntityAction.hideEditFormOverlay();
                Y.Wegas.Facade.Page.cache.editMeta(page.get("id"), {
                    name: value.name
                }, Y.bind(this.buildIndex, this));

            }, this));
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
        CSS_PREFIX: "wegas-page-editor",
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

    PageMeta = Y.Base.create("wegas-pagemeta", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string",
                optional: true,
            }
        }
    });
});