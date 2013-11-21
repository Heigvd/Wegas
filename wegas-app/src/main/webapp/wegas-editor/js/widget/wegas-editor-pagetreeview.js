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
        },
        renderUI: function() {
            this.treeView = new Y.TreeView({
                render: this.get(CONTENT_BOX)
            });
            if (DATASOURCE.editable) {
                this.treeView.plug(Y.Plugin.TreeViewSortable, {
                    nodeGroups: [{
                            nodeClass: "widget-node",
                            parentNode: ".container-node"
                        }]
                });
            }
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
            var bindChangePage = Y.bind(function(pageId) {
                if (parseInt(this.get("pageLoader").get("pageId"), 10) === parseInt(pageId, 10)) {
                    return;
                }
                this.showOverlay();
                Y.soon(Y.bind(function(id) {
                    this.get("pageLoader").set("pageId", id);
                }, this, pageId));
            }, this);
            this.on("*:newPage", function(e) {
                DATASOURCE.createPage(PageTreeview.DEFAULT_NEWPAGE, Y.bind(function(page, id) {
                    bindChangePage(id);
                }, this));
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
            this.treeView.on("treenode:click", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data").page) {
                    bindChangePage(node.get("data").page);
                    // node.get("rightWidget").menu.getMenu().item(0).fire("click");// Fire 1st menu item action on page click
                } else if (node.get("data.widget")) {
                    node.get("data.widget").get(BOUNDING_BOX).scrollIntoView();
                    if (DATASOURCE.editable) {
                        node.get("rightWidget").simulate("click");
                        node.get("rightWidget").menu.getMenu().item(0).fire("click");
                        node.get("rightWidget").menu.menu.hide();
                    }
                }
            }, this);
            this.treeView.on("treeleaf:click", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data.widget")) {
                    node.get("data.widget").get(BOUNDING_BOX).scrollIntoView();
                    if (DATASOURCE.editable) {
                        node.get("rightWidget").simulate("click");
                        node.get("rightWidget").menu.getMenu().item(0).fire("click");
                        node.get("rightWidget").menu.menu.hide();
                    }
                }
            }, this);
            this.treeView.on("treenode:nodeExpanded", function(e) {
                var node = e.node;
                if (!node.get("data")) {
                    return;
                }
                if (node.get("data").page) {
                    bindChangePage(node.get("data").page);
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
                Y.soon(Y.bind(this.getIndex, this));
            }, this);
            //if (this.get("pageLoader")) {
            //    this.get("pageLoader").after("pageIdChange", this.syncUI, this);
            //}
            //this.get("pageLoader").get("widget").after("*:destroy", this.syncUI, this);
        },
        buildWidgetTree: function(node) {
            var widget = this.get("pageLoader").get("widget");
            this.cleanAllChildren();
            node.removeAll().each(function() {
                Y.soon(Y.bind(this.destroy, this));
            });
            this.buildSubTree(node, widget);
            node.expand(false);
        },
        buildSubTree: function(node, widget) {
            var treeNode, button = new Y.Node.create("<span class=\"wegas-treeview-editmenubutton\"></span>"),
                    menuCfg;
            if (!widget || typeof widget.getMenuCfg !== "function") {
                if(widget){
                    Y.log(widget + " not editable", "warn", "Y.Wegas.PageEditorTreeView");
                }
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
                    label: widget.getEditorLabel() ? widget.getEditorLabel() : "<i>" + widget.getType() + "</i>",
                    tooltip: "Type: " + widget.getType(),
                    rightWidget: DATASOURCE.editable ? button : null,
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
                    label: widget.getEditorLabel() ? widget.getEditorLabel() : "<i>" + widget.getType() + "</i>",
                    tooltip: "Type: " + widget.getType(),
                    rightWidget: DATASOURCE.editable ? button : null,
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
                    pageFound = false,
                    widget = this.get("pageLoader").get("widget"), button,
                    bindChangePage = Y.bind(function(pageId) {
                        this.get("pageLoader").set("pageId", pageId);
                    }, this),
                    bindHideOverlay = Y.bind(this.hideOverlay, this),
                    deletePage = function(pageId) {
                        var i;
                        if (confirm("You are removing a page, this can't be undone. Are you sure?")) {
                            if (this.get("selected") && this.get("parent").size() > 1) {
                                i = this.get("parent").indexOf(this);
                                bindChangePage(this.get("parent").item(i > 0 ? i - 1 : i + 1).get("data.page"));
                            }
                            DATASOURCE.deletePage(pageId);
                            this.destroy();
                            bindHideOverlay();
                        }
                    }, duplicatePage = function(pageId) {
                DATASOURCE.duplicate(pageId, Y.bind(function(page, id) {
                    this.get("pageLoader").set("pageId", id);
                }, this));
            }, buildSub = function(node, widget) {
                this.buildSubTree(node, widget);
                if (node.item(0) && node.item(0).expand) {
                    node.item(0).expand(false);
                }
                node.set("selected", 2);
                for (i in twState) {
                    if (twState.hasOwnProperty(i)) {
// don't care about first level.
                        delete twState[i].expanded;
                    }
                }
                this.treeView.applyState(twState);
                this.hideOverlay();
            };
            this.showOverlay();
            this.treeView.removeAll().each(function() {
                Y.soon(Y.bind(this.destroy, this));
            });
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
                                label: "Rename",
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
                        event: "click",
                        on: {/* @HACK */
                            menuOpen: Y.bind(function(node, e) {
                                var menu, i, menuCfg = [];
                                if (!node.size() || e.target._mixed) {
                                    return;
                                }
                                menu = node.item(0).get("data.widget").getMenuCfg({
                                    targetwidget: node.item(0).get("data.widget")
                                });
                                for (i = 0; i < menu.length; i += 1) {
                                    if (menu[i].label !== "Delete") {
                                        menuCfg.push(menu[i]);
//                                        e.target.add(menu[i], 0);
                                    }
                                }
                                e.target.add(menuCfg, 0);
                                e.target._mixed = true;
                            }, button, node)
                        }                                                       /* End @HACK */
                    });
                    if (DATASOURCE.editable) {
                        node.set("rightWidget", button);
                    }
                    if (+i === +page) { //current page
                        pageFound = true;
                        node.set("collapsed", false);
                        Y.soon(Y.bind(buildSub, this, node, widget));
                    }
                }
            }
            if (!pageFound) { //no page is selected
                this.hideOverlay();
            }
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
