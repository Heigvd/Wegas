/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-editor-pagetreeview', function(Y) {
    "use strict";

    var PageTreeview, PageMeta, CONTENT_BOX = "contentBox",
            BOUNDING_BOX = "boundingBox",
            DATASOURCE = Y.Wegas.Facade.Page.cache;

    PageTreeview = Y.Base.create("wegas-editor-page", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetChild], {
        initializer: function() {
            this.plug(Y.Plugin.WidgetToolbar);
            this.handlers = [];
        },
        renderUI: function() {
            this.treeView = new Y.TreeView({
                render: this.get(CONTENT_BOX)
            });
            this.treeView.plug(Y.Plugin.TreeViewSortable, {
                nodeGroups: [{
                        nodeClass: "widget-node",
                        parentNode: ".container-node"
                    }]
            });
            this.toolbar.add(new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>New",
                on: {
                    click: function() {
                        this.fire("newPage");
                    }
                }
            }));
        },
        getIndex: function() {
            DATASOURCE.getIndex(Y.bind(this.buildIndex, this));
        },
        bindUI: function() {
            this.on("*:newPage", function(e) {
                DATASOURCE.createPage(PageTreeview.DEFAULT_NEWPAGE, Y.bind(function(page, id) {
                    this.get("pageLoader").set("pageId", id);
                }, this));
            });
            this.treeView.sortable.after("sort", function(e) {
                if (e.dropWidget.get("data.widget")) {
                    e.dropWidget.get("data.widget").add(e.dragWidget.get("data.widget"), e.index);
                    DATASOURCE.patch(e.dropWidget.get("data.widget").get("root").toObject());
                }
            }, this);
            this.treeView.on("treenode:click", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data").page) {
                    this.get("pageLoader").set("pageId", node.get("data").page);
                    // node.get("rightWidget").menu.getMenu().item(0).fire("click");// Fire 1st menu item action on page click
                } else if (node.get("data.widget")) {
                    node.get("data.widget").get(BOUNDING_BOX).scrollIntoView();
                    node.get("rightWidget").simulate("click");
                    node.get("rightWidget").menu.getMenu().item(0).fire("click");
                    node.get("rightWidget").menu.menu.hide();
                }
            }, this);
            this.treeView.on("treeleaf:click", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data.widget")) {
                    node.get("data.widget").get(BOUNDING_BOX).scrollIntoView();
                    node.get("rightWidget").simulate("click");
                    node.get("rightWidget").menu.getMenu().item(0).fire("click");
                    node.get("rightWidget").menu.menu.hide();
                }
            }, this);
            this.treeView.on("treenode:nodeExpanded", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data").page) {
                    this.get("pageLoader").set("pageId", node.get("data").page);
                }
            }, this);
            this.treeView.get(CONTENT_BOX).delegate("mouseenter", function(e) {
                var node = Y.Widget.getByNode(e.target);
                e.halt(true);
                if (!node) {
                    return;
                }
                if (node.get("data.widget")) {
                    if (this.get("pageLoader").pageeditor) {
                        this.get("pageLoader").pageeditor.showOverlay(node.get("data.widget"));
                    } else {
                        node.get("data.widget").get(BOUNDING_BOX).addClass("wegas-focused-widget");
                    }
                }
            }, ".content-header", this);
            this.treeView.get(CONTENT_BOX).delegate("mouseleave", function(e) {
                var node = Y.Widget.getByNode(e.target);
                e.halt(true);
                if (!node) {
                    return;
                }
                if (node.get("data.widget")) {
                    if (this.get("pageLoader").pageeditor) {
                        this.get("pageLoader").pageeditor.hideOverlay();
                    } else {
                        node.get("data.widget").get(BOUNDING_BOX).removeClass("wegas-focused-widget");
                    }
                }
            }, ".content-header", this);
            DATASOURCE.after("pageUpdated", function(e) {
                this.getIndex();
            }, this);
            //if (this.get("pageLoader")) {
            //    this.get("pageLoader").after("pageIdChange", this.syncUI, this);
            //}
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
                    menuCfg;
            if (!widget) {
                return;
            }
            menuCfg = widget.getMenuCfg({
                widget: widget
            });
            button.once("click", function(e) {
                var target = Y.Widget.getByNode(e.target);
                e.halt(true);
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
                    label: "" + widget.getType() + (widget.getEditorLabel() ? ": " + widget.getEditorLabel() : ""),
                    rightWidget: button,
                    data: {
                        widget: widget
                    },
                    cssClass: "container-node widget-node",
                    iconCSS: "wegas-icon-" + Y.Wegas.Helper.escapeCSSClass(widget.getType())
                });
                widget.each(function(item) {
                    this.buildSubTree(treeNode, item);
                }, this);
            } else {
                treeNode = new Y.TreeLeaf({
                    label: "" + widget.getType() + (widget.getEditorLabel() ? ": " + widget.getEditorLabel() : ""),
                    rightWidget: button,
                    data: {
                        widget: widget
                    },
                    cssClass: "widget-node",
                    iconCSS: "wegas-icon-" + Y.Wegas.Helper.escapeCSSClass(widget.getType())
                });
            }
            node.add(treeNode);
        },
        buildIndex: function(index) {
            var i, page = this.get("pageLoader").get("pageId"),
                    node,
                    twState = this.treeView.saveState(),
                    widget = this.get("pageLoader").get("widget"), button,
                    deletePage = function(pageId) {
                if (confirm("You are removing a page, this can't be undone. Are you sure?")) {
                    DATASOURCE.deletePage(pageId);
                    this.destroy();
                }
            }, duplicatePage = function(pageId) {
                DATASOURCE.duplicate(pageId, Y.bind(function(page, id) {
                    this.get("pageLoader").set("pageId", id);
                }, this));
            };
            this.treeView.removeAll();
            for (i in index) {
                if (index.hasOwnProperty(i)) {
                    node = new Y.TreeNode({
                        label: index[i] !== "" ? index[i] + " (" + i + ")" : "<i>Unnamed (" + i + ")</i>",
                        data: {
                            page: i,
                            name: index[i]
                        },
                        cssClass: "page-node",
                        iconCSS: "wegas-icon-page"
                    });
                    this.treeView.add(node);
                    button = new Y.Node.create("<span class=\"wegas-treeview-editmenubutton\"></span>");
                    button.plug(Y.Plugin.WidgetMenu, {
                        children: [{
                                type: "Button",
                                label: "Edit",
                                on: {
                                    click: Y.bind(this.editPage, this, node.get("data"))
                                }
                            }, {
                                type: "Button",
                                label: "Duplicate",
                                on: {
                                    click: Y.bind(duplicatePage, this, i)
                                }
                            }, {
                                type: "Button",
                                label: "Delete",
                                on: {
                                    click: Y.bind(deletePage, node, i)
                                }
                            }],
                        event: "click"
                    });
                    node.set("rightWidget", button);
                    if (+i === +page) {
                        this.buildSubTree(node, widget);
                        node.expand(false);
                        node.set("selected", 2);
                    }
                }
            }
            for (i in twState) {
                if (twState.hasOwnProperty(i)) {
// don't care about first level.
                    delete twState[i].expanded;
                }
            }
            this.treeView.applyState(twState);
        },
        editPage: function(meta) {
            Y.Plugin.EditEntityAction.showEditForm(new PageMeta({id: meta.page, name: meta.name}), Y.bind(function(value, page) {
                Y.Plugin.EditEntityAction.hideEditFormOverlay();
                DATASOURCE.editMeta(page.get("id"), {
                    name: value.name
                }, Y.bind(this.buildIndex, this));
            }, this));
        },
        cleanAllChildren: function() {
            var i;
            for (i in this.treeView._items) {
                if (this.treeView._items.hasOwnProperty(i)) {
                    this.treeView._items[i].collapse(false);
                }
//this.treeView._items[i].removeAll();
            }
        },
        destructor: function() {
            var i;
            this.treeView.destroy();
            try {
                for (i in this.handlers) {
                    if (this.handlers.hasOwnProperty(i)) {
                        this.handlers[i].detach();
                    }
                }
            } catch (e) {
                // don't care !!!! @fixme POKEMON ANTI-PATTERN
            }
        }
    }, {
        CSS_PREFIX: "wegas-page-editor",
        DEFAULT_NEWPAGE: {type: "AbsoluteLayout"},
        ATTRS: {
            pageLoader: {
                value: "previewPageLoader",
                getter: function(v) {
                    return Y.Wegas.PageLoader.find(v);
                },
                setter: function(v) {
                    if (Y.Wegas.PageLoader.find(v)) {
                        if (this.get("previewPageLoader")) {
                            Y.Wegas.PageLoader.find(this.get("previewPageLoader")).detach("contentUpdated", this.getIndex, this);
                        }
                        Y.Wegas.PageLoader.find(v).after("contentUpdated", this.getIndex, this);
                    }
                    return v;
                }
            }
        }
    });
    Y.namespace("Wegas").PageTreeview = PageTreeview;

    PageMeta = Y.Base.create("wegas-pagemeta", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string",
                optional: true
            }
        }
    });
});
