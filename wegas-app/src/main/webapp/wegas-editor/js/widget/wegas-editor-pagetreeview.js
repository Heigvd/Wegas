/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-editor-pagetreeview', function(Y) {
    "use strict";

    var PageTreeview, CONTENT_BOX = "contentBox",
            BOUNDING_BOX = "boundingBox", HOST = "host",
            Wegas = Y.Wegas, Plugin = Y.Plugin,
            DATASOURCE = Wegas.Facade.Page.cache;

    PageTreeview = Y.Base.create("wegas-editor-page", Y.Widget, [Wegas.Widget, Wegas.Editable, Y.WidgetChild], {
        renderUI: function() {
            this.treeView = new Y.TreeView({
                render: this.get(CONTENT_BOX)
            });                                                                 // Render the treeview
            this.treeView.addTarget(this);                                      // Treeview events bubble
            this.plug(Plugin.WidgetToolbar);                                    // Add a toolbar

            if (DATASOURCE.editable) {
                this.plug(PageTreeviewToolbarMenu);
                this.plug(PageTreeViewContextMenu);
                this.treeView.plug(Plugin.TreeViewSortable, {
                    nodeGroups: [{
                            nodeClass: "widget-node",
                            parentNode: ".container-node"
                        }]
                });
                this.toolbar.add({
                    label: "<span class=\"wegas-icon wegas-icon-new\"></span>New page",
                    on: {
                        click: Y.bind(function() {
                            DATASOURCE.createPage(PageTreeview.DEFAULT_NEWPAGE, Y.bind(function(page, id) {
                                this.changePage(id);
                            }, this));
                        }, this)
                    }
                });
            }
        },
        bindUI: function() {
            this.on(["treenode:click", "treenode:nodeExpanded", "treeleaf:click"], function(e) {// Change the current page whenever a page node is expanded
                if (e.node.get("data.page")) {
                    this.changePage(e.node.get("data.page"));
                }
            });

            if (DATASOURCE.editable) {
                this.treeView.sortable.on("sort", function(e) {
                    if (!e.dropWidget.get(BOUNDING_BOX).hasClass("container-node")) { //@TODO: find something better.
                        e.preventDefault();
                        this.getIndex();
                    } else if (e.dropWidget.get("data.widget")) {
                        e.dropWidget.get("data.widget").add(e.dragWidget.get("data.widget"), e.index);
                        DATASOURCE.patch(e.dropWidget.get("data.widget").get("root").toObject());
                    }
                }, this);
            }
            this.treeView.get(CONTENT_BOX).delegate("mouseenter", function(e) {
                var node = Y.Widget.getByNode(e.target);
                e.halt(true);
                if (!node) {
                    return;
                }
                if (node.get("data.widget")) {
                    if (this.get("pageLoader").pageeditor) {
                        this.get("pageLoader").pageeditor.fixedOverlay(node.get("data.widget"));
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
                        this.get("pageLoader").pageeditor.shownOverlay.hide();
                    } else {
                        node.get("data.widget").get(BOUNDING_BOX).removeClass("wegas-focused-widget");
                    }
                }
            }, ".content-header", this);

            this.dsEvent = DATASOURCE.after("pageUpdated", function(e) {
                this.showOverlay();
                this.getIndex();
            }, this);
            //if (this.get("pageLoader")) {
            //    this.get("pageLoader").after("pageIdChange", this.syncUI, this);
            //}
            //this.get("pageLoader").get("widget").after("*:destroy", this.syncUI, this);
        },
        getIndex: function() {
            DATASOURCE.getIndex(Y.bind(this.buildIndex, this));
        },
        buildWidgetTree: function(node) {
            var widget = this.get("pageLoader").get("widget");
            this.cleanAllChildren();
            node.destroyAll();
            this.buildSubTree(node, widget);
            node.expand(false);
        },
        buildSubTree: function(node, widget) {
            var treeNode;

            if (!widget || typeof widget.getMenuCfg !== "function") {
                Y.log(widget + " not editable", "warn", "Y.Wegas.PageEditorTreeView");
                return;
            }
            if (widget.each && !(widget instanceof Wegas.PageLoader)) {
                treeNode = new Y.TreeNode({
                    label: widget.getEditorLabel() ? widget.getEditorLabel() : "<i>" + widget.getType() + "</i>",
                    tooltip: "Type: " + widget.getType(),
                    data: {
                        widget: widget
                    },
                    cssClass: "container-node widget-node",
                    iconCSS: "wegas-icon-" + Wegas.Helper.escapeCSSClass(widget.getType())
                });
                widget.each(function(item) {
                    this.buildSubTree(treeNode, item);
                }, this);
            } else {
                treeNode = new Y.TreeLeaf({
                    label: widget.getEditorLabel() ? widget.getEditorLabel() : "<i>" + widget.getType() + "</i>",
                    tooltip: "Type: " + widget.getType(),
                    data: {
                        widget: widget
                    },
                    cssClass: "widget-node",
                    iconCSS: "wegas-icon-" + Wegas.Helper.escapeCSSClass(widget.getType())
                });
            }
            node.add(treeNode);
        },
        buildIndex: function(index) {
            var i, node, page = this.get("pageLoader").get("pageId"),
                    twState = this.treeView.saveState(),
                    pageFound = false,
                    buildSub = function(node, widget) {
                        this.buildSubTree(node, widget);
                        if (node.item(0) && node.item(0).expand) {
                            node.item(0).expand(false);
                        }
                        //     node.set("selected", 2); // Will open edition on page load
                        for (i in twState) {
                            if (twState.hasOwnProperty(i)) {                    // don't care about first level.
                                delete twState[i].expanded;
                            }
                        }
                        this.treeView.applyState(twState);
                        this.hideOverlay();
                    };

            this.showOverlay();
            this.treeView.destroyAll();

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
                    if (+i === +page) {                                         //current page
                        pageFound = true;
                        node.set("collapsed", false);
                        Y.soon(Y.bind(buildSub, this, node, this.get("pageLoader").get("widget")));
                    }
                }
            }
            if (!pageFound) { //no page is selected
                this.hideOverlay();
            }
        },
        editPage: function(data) {
            Plugin.EditEntityAction.showEditForm(new Wegas.persistence.PageMeta({id: data.page, name: data.name}), Y.bind(function(value, page) {
                Plugin.EditEntityAction.hideEditFormOverlay();
                DATASOURCE.editMeta(page.get("id"), {
                    name: value.name
                }, Y.bind(this.buildIndex, this));
            }, this));
        },
        deletePage: function(pageId, treeNode) {
            if (confirm("You are removing a page, this can't be undone. Are you sure?")) {
                if (treeNode.get("selected") && treeNode.get("parent").size() > 1) {
                    var i = treeNode.get("parent").indexOf(treeNode);
                    this.changePage(treeNode.get("parent").item(i > 0 ? i - 1 : i + 1).get("data.page"));
                }
                DATASOURCE.deletePage(pageId);
                treeNode.destroy();
                this.hideOverlay();
            }
        },
        duplicatePage: function(pageId) {
            DATASOURCE.duplicate(pageId, Y.bind(function(page, id) {
                this.get("pageLoader").set("pageId", id);
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
        changePage: function(pageId) {
            if (parseInt(this.get("pageLoader").get("pageId"), 10) === parseInt(pageId, 10)) {
                return;
            }
            this.showOverlay();
            //Y.soon(Y.bind(function(pageId) {
            this.get("pageLoader").set("pageId", pageId);
            //}, this, pageId));
        },
        destructor: function() {
            this.treeView.destroy();
            this.dsEvent.detach();
        }
    }, {
        CSS_PREFIX: "wegas-page-editor",
        DEFAULT_NEWPAGE: {type: "AbsoluteLayout"},
        ATTRS: {
            pageLoader: {
                value: "previewPageLoader",
                getter: function(v) {
                    return Wegas.PageLoader.find(v);
                },
                setter: function(v) {
                    if (Wegas.PageLoader.find(v)) {
                        if (this.get("previewPageLoader")) {
                            Wegas.PageLoader.find(this.get("previewPageLoader")).detach(["contentUpdated", "pageIdChange"], this.getIndex, this);
                        }
                        Wegas.PageLoader.find(v).after(["contentUpdated", "pageIdChange"], this.getIndex, this);
                    }
                    return v;
                }
            }
        }
    });
    Y.namespace("Wegas").PageTreeview = PageTreeview;

    var PageTreeviewToolbarMenu = Y.Base.create("wegas-editor-page", Plugin.VariableTVToolbarMenu, [], {
        onTreeViewSelection: function(e) {
            var selection = e.target, data = selection.get("data"),
                    page = data.page,
                    widget = data.widget;

            if (page) {
                this.get(HOST).changePage(page);
                //return;
                widget = data.widget = selection.item(0) && selection.item(0).get("data.widget");// There may be no child widget when the widget is empty
            }
            if (widget && !widget.get("destroyed")) {
                widget.get(BOUNDING_BOX).scrollIntoView();
                PageTreeviewToolbarMenu.superclass.onTreeViewSelection.call(this, e);
            }

        },
        getMenuItems: function(data, node) {
            var menuItems = [], host = this.get("host");
            if (data.widget) {
                menuItems = PageTreeviewToolbarMenu.superclass.getMenuItems.call(this, data);
            }
            if (data.page) {                                                    // First level click, need to mix page edition and widget edition
                menuItems.splice(menuItems.length - 1, 1);                      // Remove widget delete button
                menuItems.splice(menuItems.length, 0, {//                       // Add page rename, copy and delete buttons
                    type: "Button",
                    label: "<span class=\"wegas-icon wegas-icon-edit\"></span>Rename",
                    on: {
                        click: Y.bind(host.editPage, host, data)
                    }
                }, {
                    type: "Button",
                    label: "<span class=\"wegas-icon wegas-icon-copy\"></span>Copy",
                    on: {
                        click: Y.bind(host.duplicatePage, host, data.page)
                    }
                }, {
                    type: "Button",
                    label: "<span class=\"wegas-icon wegas-icon-delete\"></span>Delete",
                    on: {
                        click: Y.bind(host.deletePage, host, data.page, node)
                    }
                });
            }
            return menuItems;
        }
    }, {
        NS: "menu"
    });

    var PageTreeViewContextMenu = Y.Base.create("admin-menu", Plugin.EditorTVContextMenu, [], {
        onTreeViewClick: function(e) {
            var targetWidget = Y.Widget.getByNode(e.domEvent.target),
                    page = targetWidget.get("data.page");

            if (page) {
                //return;
//                this.get(HOST).changePage(page);
                targetWidget.get("data").widget = targetWidget.item(0) && targetWidget.item(0).get("data.widget");// There may be no child widget when the widget is empty
            }

            PageTreeViewContextMenu.superclass.onTreeViewClick.call(this, e);
        },
        getMenuItems: function() {
            return PageTreeviewToolbarMenu.prototype.getMenuItems.apply(this, arguments);
        }
    }, {
        NS: "contextmenu"
    });
});
