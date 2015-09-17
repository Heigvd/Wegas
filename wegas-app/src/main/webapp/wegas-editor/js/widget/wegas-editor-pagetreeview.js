/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add("wegas-editor-pagetreeview", function(Y) {
    "use strict";

    var PageTreeViewContextMenu,
        PageTreeviewToolbarMenu,
        PageTreeview, CONTENT_BOX = "contentBox",
        BOUNDING_BOX = "boundingBox", HOST = "host",
        Wegas = Y.Wegas, Plugin = Y.Plugin,
        DATASOURCE = Wegas.Facade.Page.cache;

    PageTreeview = Y.Base.create("wegas-editor-page", Y.Widget, [Wegas.Widget, Wegas.Editable, Y.WidgetChild], {
        renderUI: function() {
            this.treeView = new Y.TreeView().render(this.get(CONTENT_BOX));     // Render the treeview
            this.treeView.addTarget(this);                                      // Treeview events bubble
            this.plug(Plugin.WidgetToolbar);                                    // Add a toolbar

            if (DATASOURCE.editable) {
                this.plug(PageTreeviewToolbarMenu);
                this.plug(PageTreeViewContextMenu);
                this.treeView.plug(Plugin.TreeViewSortable, {
                    nodeGroups: [{
                        nodeClass: "widget-node",
                        parentNode: ".container-node"
                    }, {
                        nodeClass: "page-node",
                        parentNode: ".yui3-treeview-content"
                    }]
                });
                this.toolbar.add({
                    label: "<span class=\"wegas-icon wegas-icon-new\"></span>New",
                    on: {
                        click: Y.bind(function() {
                            DATASOURCE.createPage(PageTreeview.DEFAULT_NEWPAGE, Y.bind(function(page, id) {
                                this.changePage(id, Y.bind(function(id) {
                                    this.treeView.some(function() {
                                        if (+this.get("data.page") === +id) {
                                            this.fire("click");
                                            return true;
                                        }
                                    });
                                }, this, id), true);
                            }, this));
                        }, this)
                    }
                });
            }
            this.getIndex();
        },
        bindUI: function() {
            this.after("treenode:nodeExpanded", function(e) {// Change the current page whenever a page node is expanded
                if (e.node.get("data.page")) {
                    e.node.fire("click", {node: e.node}); //mimic click
                }
            });
            this.plCreationEvent = Y.after("pageloader:created", function(e) {
                if (e.get("pageLoaderId") === this._pageLoaderId) {
                    this.set("pageLoader", this._pageLoaderId);
                }
            }, this);
            if (DATASOURCE.editable) {
                this.treeView.sortable.on("sort", function(e) {
                    if (e.dragWidget.get("data.page")) {
                        DATASOURCE.move(e.dragWidget.get("data.page"), e.index, Y.bind(function() {
                            this.getIndex();
                        }, this));
                    } else if (!e.dropWidget.get(BOUNDING_BOX).hasClass("container-node")) { //@TODO: find something better.
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
                //this.showOverlay();
                this.getIndex();
            }, this);
            //if (this.get("pageLoader")) {
            //    this.get("pageLoader").after("pageIdChange", this.syncUI, this);
            //}
            //this.get("pageLoader").get("widget").after("*:destroy", this.syncUI, this);
        },
        getIndex: function() {
            if (this.indexReq) {
                return;
            }
            this.indexReq = DATASOURCE.getIndex(Y.bind(function(index) {
                this.indexReq = null;
                this.buildIndex(index);
            }, this));
        },
        buildWidgetTree: function(node) {
            var widget = this.get("pageLoader").get("widget");
            this.cleanAllChildren();
            node.destroyAll();
            this.buildSubTree(node, widget);
            node.expand(false);
        },
        buildSubTree: function(node, widget) {
            var treeNode, selected;

            if (!widget || typeof widget.getMenuCfg !== "function") {
                Y.log(widget + " not editable", "warn", "Y.Wegas.PageEditorTreeView");
                return;
            }
            selected = widget.get("boundingBox").hasClass("highlighted") ? 2 : 0;
            if (widget.isAugmentedBy(Wegas.Parent)) {
                treeNode = new Y.TreeNode({
                    label: widget.getEditorLabel() || "<i>" + widget.getType() + "</i>",
                    tooltip: "Type: " + widget.getType(),
                    selected: selected,
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
                    label: widget.getEditorLabel() || ("<i>" + widget.getType() + "</i>"),
                    tooltip: "Type: " + widget.getType(),
                    selected: selected,
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
            var i, node, page = -1,
                twState, tmpPageId,
                pageFound = false,
                buildSub = function(node, widget) {
                    this.buildSubTree(node, widget);
                    if (node.item(0) && node.item(0).expand) {
                        node.item(0).expand(false);
                    }
                    this.treeView.applyState(twState);
                    this.hideOverlay();
                    /*
                     * after a widget.rebuild(), update references.
                     */
                    if (node.item(0)) {
                        node.item(0).get("data.widget").detach("*:addChild", this.getIndex, this);
                        node.item(0).get("data.widget").onceAfter("*:addChild", this.getIndex, this);
                    }
                };
            if (this.get("pageLoader")) {
                page = this.get("pageLoader")._pageId;
            }
            twState = this.treeView.saveState();
            Y.Object.each(twState, function(v) {
                v.expanded = false;
            });
            this.showOverlay();
            this.treeView.destroyAll();

            for (i in index) {
                if (index.hasOwnProperty(i)) {
                    tmpPageId = "" + index[i].id;
                    node = new Y.TreeNode({
                        label: index[i].name ? index[i].name + " (" + tmpPageId + ")" :
                        "<i>Unnamed (" + tmpPageId + ")</i>",
                        data: {
                            page: tmpPageId,
                            name: index[i].name
                        },
                        cssClass: "page-node",
                        iconCSS: "wegas-icon-page"
                    });
                    this.treeView.add(node);
                    if (tmpPageId === "" + page) {                                         //current page
                        pageFound = true;

                        node.get(BOUNDING_BOX).addClass("current-page");
                        buildSub.call(this, node, this.get("pageLoader").get("widget"));
                    }
                    node.set("collapsed", (tmpPageId !== "" + page));
                }
            }
            if (!pageFound) {                                                   //no page is selected
                this.hideOverlay();
            }
        },
        editPage: function(data) {
            Plugin.EditEntityAction.showEditForm(new Wegas.persistence.PageMeta({
                id: data.page,
                name: data.name
            }), Y.bind(function(value, page) {
                Plugin.EditEntityAction.hideEditFormOverlay();
                DATASOURCE.editMeta(page.get("id"), {
                    name: value.name
                }, Y.bind(this.buildIndex, this));
            }, this));
        },
        deletePage: function(pageId) {
            var treeNode, i;

            Wegas.Panel.confirm("You are removing a page, this can't be undone. Are you sure?", Y.bind(function() {
                this.treeView.some(function() {
                    if (+this.get("data.page") === +pageId) {
                        treeNode = this;
                        return true;
                    }
                });
                DATASOURCE.deletePage(pageId, Y.bind(function() {
                    if (this.get("pageLoader").get("pageId") === pageId && treeNode.get("parent").size() > 1) {
                        i = treeNode.get("parent").indexOf(treeNode);
                        treeNode.get("parent").item(i > 0 ? i - 1 : i + 1).fire("click");
                    } else {
                        this.getIndex();
                        if (this.treeView.size() === 0) {
                            this.get("pageLoader").set("pageId", 1);
                        }
                    }
                }, this));
                this.hideOverlay();
            }, this));
        },
        duplicatePage: function(pageId) {
            DATASOURCE.duplicate(pageId, Y.bind(function(page, id) {
                this.changePage(id, null, true);
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
        changePage: function(pageId, callback, force) {
            var pageLoader = this.get("pageLoader");
            if (!pageLoader) {
                return;
            }
            if (force) {
                pageLoader.set("pageId", null, {noquery: true});   //be sure to change (stuck on an non-existent page 1)
            }
            if (parseInt(pageLoader.get("pageId"), 10) === parseInt(pageId, 10)) {
                if (Y.Lang.isFunction(callback)) {
                    callback(pageLoader.get("widget"));
                }
                return;
            }
            //this.showOverlay();

            pageLoader.onceAfter("contentUpdated", function() {
                this.hideOverlay();
                if (Y.Lang.isFunction(callback)) {
                    callback(this.get("pageLoader").get("widget"));
                }
                this.treeView.some(function(item) {
                    if (item.get("data.page") === pageId) {
                        Wegas.Helper.scrollIntoViewIfNot(item.get(BOUNDING_BOX));
                        return true;
                    }
                    return false;
                });
            }, this);

            this.get("pageLoader").set("pageId", pageId);
        },
        destructor: function() {
            this.treeView.destroy();
            this.dsEvent.detach();
            this.plCreationEvent.detach();
            Wegas.DataSource.abort(this.indexReq);
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
                            Wegas.PageLoader.find(this.get("previewPageLoader")).detach(["contentUpdated", "destroy"],
                                this.getIndex,
                                this);
                        }
                        Wegas.PageLoader.find(v).after(["contentUpdated", "destroy"], this.getIndex, this);
                    }
                    this._pageLoaderId = v;
                    return v;
                }
            }
        }
    });
    Wegas.PageTreeview = PageTreeview;

    PageTreeviewToolbarMenu = Y.Base.create("wegas-editor-page", Plugin.EditorTVDefaultMenuClick, [], {
        onTreeViewSelection: function(e) {
            var selection = e.target, data = selection.get("data"),
                page, widget;
            if (Y.Lang.isUndefined(data)) {
                return;
            }
            page = data.page;
            widget = data.widget;

            if (page) {
                this.get(HOST).changePage(page, Y.bind(function(widget) {
                    data.widget = widget;
                    PageTreeviewToolbarMenu.superclass.onTreeViewSelection.call(this, e);
                }, this));
            } else if (widget && !widget.get("destroyed")) {
                Wegas.Helper.scrollIntoViewIfNot(widget.get(BOUNDING_BOX));
                PageTreeviewToolbarMenu.superclass.onTreeViewSelection.call(this, e);
            }
        },
        getMenuItems: function(data) {
            var menuItems = [], host = this.get("host");
            if (!Y.Lang.isObject(data)) {
                return menuItems;
            }
            if (data.widget) {
                menuItems = PageTreeviewToolbarMenu.superclass.getMenuItems.call(this, data);
                if (data.page) {
                    menuItems.splice(menuItems.length - 2, 2);                      // Remove widget delete, copy button
                }
            }
            if (data.page) {                                                    // First level click, need to mix page edition and widget edition
                //
                menuItems.splice(menuItems.length,
                    0,
                    /*{//                       // Add page rename, copy and delete buttons
                     type: "Button",
                     label: "<span class=\"wegas-icon wegas-icon-edit\"></span>Rename",
                     on: {
                     click: Y.bind(host.editPage, host, data)
                     }
                     }, */
                    {
                        type: "Button",
                        label: "<span class=\"wegas-icon wegas-icon-copy\"></span>Copy",
                        on: {
                            click: Y.bind(host.duplicatePage, host, data.page)
                        }
                    },
                    {
                        type: "Button",
                        label: "<span class=\"wegas-icon wegas-icon-delete\"></span>Delete",
                        on: {
                            click: Y.bind(host.deletePage, host, data.page)
                        }
                    });
                if (!data.widget) {
                    menuItems.splice(0, 0, {
                        type: "Button",
                        label: "<span class=\"wegas-icon wegas-icon-edit\"></span>Rename",
                        on: {
                            click: Y.bind(host.editPage, host, data)
                        }
                    });
                }
            }
            return menuItems;
        }
    }, {
        NS: "menu"
    });

    PageTreeViewContextMenu = Y.Base.create("admin-menu", Plugin.EditorTVContextMenu, [], {
        onTreeViewClick: function(e) {
            var targetWidget = Y.Widget.getByNode(e.domEvent.target),
                page = targetWidget.get("data.page");

            if (page) {
                //return;
                //                this.get(HOST).changePage(page);
                /* There may be no child widget when the widget is empty */
                targetWidget.get("data").widget = targetWidget.item(0) && targetWidget.item(0).get("data.widget");
            }

            PageTreeViewContextMenu.superclass.onTreeViewClick.call(this, e);
        },
        getMenuItems: function() {
            return PageTreeviewToolbarMenu.prototype.getMenuItems.apply(this, arguments);
        }
    }, {
        NS: "contextmenu"
    });

    Plugin.UneditablePageDisabler = Y.Base.create('wegas-pagetab-disabler', Plugin.Base, [], {
        initializer: function() {
            if (!DATASOURCE.editable) {
                this.get("host").get(BOUNDING_BOX).addClass("wegas-advanced-feature");
            }
        }
    }, {NS: "pagetabdisabler"});
});
