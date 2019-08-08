/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
YUI.add("wegas-editor-pagetreeview", function(Y) {
    "use strict";

    var PageTreeViewContextMenu,
        PageTreeviewToolbarMenu,
        PageTreeview,
        CONTENT_BOX = "contentBox",
        BOUNDING_BOX = "boundingBox",
        HOST = "host",
        Wegas = Y.Wegas,
        Plugin = Y.Plugin,
        DATASOURCE = Wegas.Facade.Page.cache;

    PageTreeview = Y.Base.create("wegas-editor-page", Y.Widget, [Wegas.Widget, Wegas.Editable, Y.WidgetChild], {
        renderUI: function() {
            this.treeView = new Y.TreeView().render(this.get(CONTENT_BOX)); // Render the treeview
            this.treeView.addTarget(this); // Treeview events bubble
            this.plug(Plugin.WidgetToolbar); // Add a toolbar

            this.handlers = [];
            if (DATASOURCE.isEditable()) {
                this.plug(PageTreeviewToolbarMenu);
                this.plug(PageTreeViewContextMenu);
                this.treeView.plug(Plugin.TreeViewSortable, {
                    nodeGroups: [{
                            nodeClass: "widget-node",
                            parentNode: "container-node"
                        }, {
                            nodeClass: "page-node",
                            parentNode: "yui3-treeview"
                        }]
                });

                var header = this.toolbar.get("header");
                this.btnNew = new Y.Button({
                    label: "<span class=\"fa fa-plus-circle\"></span> New page"
                }).render(header);
            }
            this.getIndex();
        },
        bindUI: function() {
            this.after("treenode:nodeExpanded", function(e) { // Change the current page whenever a page node is expanded
                if (e.node.get("data.page")) {
                    e.node.fire("click", {
                        node: e.node
                    }); //mimic click
                }
            });
            this.handlers.push(Y.after("pageloader:created", function(e) {
                if (e.get("pageLoaderId") === this._pageLoaderId) {
                    this.set("pageLoader", this._pageLoaderId);
                }
            }, this));

            if (DATASOURCE.isEditable()) {
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


            this.handlers.push(DATASOURCE.after("forceIndexUpdate", function(e) {
                this.getIndex();
            }, this));

            this.handlers.push(DATASOURCE.after("pageUpdated", function(e) {
                //this.showOverlay();
                if (e.page) {
                    // useless to update the tree view  now as the page as not been updated yet
                    // one should wait for the *:addChild event
                    //this.updatePageIndex(e.page);
                } else {
                    this.getIndex();
                }
            }, this));

            //if (this.get("pageLoader")) {
            //    this.get("pageLoader").after("pageIdChange", this.syncUI, this);
            //}
            //this.get("pageLoader").get("widget").after("*:destroy", this.syncUI, this);

            this.handlers.push(this.treeView.on("nodeClick", function(e) {
                e.preventDefault();
            }));
            this.handlers.push(Y.after("edit-entity:edit", function(e) {
                var cur = this.treeView.find(function(item) {
                    if (item.get("data.page") !== undefined && e.entity["@pageId"] && item.get("data.page") === e.entity["@pageId"]) {
                        return true;
                    }
                    return item.get("data.widget") ?
                        item.get("data.widget")._yuid === e.entity._yuid :
                        false;

                });
                this.treeView.deselectAll();
                if (cur) {
                    this.currentSelection = e.entity.get("id");
                    cur.set("selected", 2);
                }
            }, this));
            this.handlers.push(Y.after("edit-entity:cancel", function(e) {
                this.currentSelection = -1;
                this.treeView.set("selected", 0);
            }, this));

            // Initialize the 'New page' button menu :
            var menu = [];
            menu.push({
                type: "Button",
                label: "Standard (List layout)",
                on: {
                    click: Y.bind(
                        function(e) {
                            this.newPage({
                                type: "FlexList"
                            })
                        }, this)
                }
            });
            menu.push({
                type: "Button",
                label: "Beginner (Absolute layout)",
                on: {
                    click: Y.bind(
                        function(e) {
                            this.newPage({
                                type: "AbsoluteLayout"
                            })
                        }, this)
                }
            });

            this.btnNew.plug(Plugin.WidgetMenu, {
                children: menu
            });

        },
        newPage: function(pageType) {
            DATASOURCE.createPage(pageType, Y.bind(function(page, id) {
                this.changePage(id, Y.bind(function(id) {
                    this.treeView.some(function() {
                        if (+this.get("data.page") === +id) {
                            this.fire("click");
                            return true;
                        }
                    });
                }, this, id), true);
            }, this));
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

            if (!widget || typeof widget.getMenuCfg !== "function" || !widget.get("editable")) {
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
        updateWidget: function(e) {
            var updatedWidget = e.target || e.currentTarget; // currentTarget is the page, target the widget
            var currentNode;

            var isPage = !!updatedWidget["@pageId"];

            // fetch the node whom the updated child belongs
            currentNode = this.treeView.find(function(item) {
                if (isPage) {
                    return item.get("data.page") === updatedWidget["@pageId"];
                } else {
                    if (item.get("data.widget")) {
                        return item.get("data.widget") === updatedWidget;
                    }
                }
            });

            if (currentNode) {
                var state = this.treeView.saveState();
                var scrollTop = this.get("contentBox").getDOMNode().scrollTop;
                currentNode.destroyAll();

                if (isPage) {
                    // rebuild the while page tree
                    this.buildSub(currentNode, updatedWidget);
                } else {
                    /*
                     * after a widget.rebuild(), update references.
                     */
                    e.currentTarget.detach("*:addChild", this.updateWidget, this);
                    e.currentTarget.onceAfter("*:addChild", this.updateWidget, this);

                    e.currentTarget.detach("*:removeChild", this.updateWidget, this);
                    e.currentTarget.onceAfter("*:removeChild", this.updateWidget, this);

                    updatedWidget.each(function(item) {
                        this.buildSubTree(currentNode, item);
                    }, this);

                }
                this.treeView.applyState(state);

                // transitoin duration definee in treeview.css: 150ms
                Y.later(155, this, function() {
                    this.get("contentBox").getDOMNode().scrollTop = scrollTop;
                });
            } else {
                // node not found:  update whole treeview
                this.getIndex();
            }
        },
        buildSub: function(node, widget) {
            this.buildSubTree(node, widget);
            if (node.item(0) && node.item(0).expand) {
                node.item(0).expand(false);
            }
            /*
             * after a widget.rebuild(), update references.
             */
            if (node.item(0)) {
                node.item(0).get("data.widget").detach("*:addChild", this.updateWidget, this);
                node.item(0).get("data.widget").onceAfter("*:addChild", this.updateWidget, this);
            }

            if (node.item(0)) {
                node.item(0).get("data.widget").detach("*:removeChild", this.updateWidget, this);
                node.item(0).get("data.widget").onceAfter("*:removeChild", this.updateWidget, this);
            }
        },
        buildIndex: function(index) {
            var i, node,
                page = -1,
                twState, tmpPageId,
                pageWidget,
                isDefaultPage = true,
                pageFound = false;

            if (this.get("pageLoader")) {
                page = this.get("pageLoader")._pageId;
                pageWidget = this.get("pageLoader").get("widget");
            }
            twState = this.treeView.saveState();
            Y.Object.each(twState, function(v) {
                v.expanded = false;
            });
            this.showOverlay();
            this.treeView.destroyAll();

            for (i in index) {
                // Make the index attribute numeric:
                index[i].index = +index[i].index;
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
                    // Is the requested page the default one and is its widget already available?
                    if (pageWidget && isDefaultPage && page === "default") {
                        tmpPageId = "default";
                    }
                    if (tmpPageId === "" + page) { //current page
                        pageFound = true;

                        node.get(BOUNDING_BOX).addClass("current-page");
                        this.buildSub(node, pageWidget);
                        this.hideOverlay();
                        this.treeView.applyState(twState);
                    }
                    node.set("collapsed", (tmpPageId !== "" + page));
                }
                isDefaultPage = false;
            }
            if (!pageFound) { //no page is selected
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
                pageLoader.set("pageId", null, {
                    noquery: true
                }); //be sure to change (stuck on an non-existent page 1)
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
            Wegas.DataSource.abort(this.indexReq);

            Y.Array.each(this.handlers, function(i) {
                i.detach();
            });
        }
    }, {
        CSS_PREFIX: "wegas-page-editor",
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
            var selection = e.target,
                data = selection.get("data"),
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
            var menuItems = [],
                host = this.get("host");
            if (!Y.Lang.isObject(data)) {
                return menuItems;
            }
            if (data.widget) {
                menuItems = PageTreeviewToolbarMenu.superclass.getMenuItems.call(this, data);
                if (data.page) {
                    menuItems.splice(menuItems.length - 2, 2); // Remove widget delete, copy button
                }
            }
            if (data.page) { // First level click, need to mix page edition and widget edition
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
                            label: "<span class=\"wegas-icon wegas-icon-copy\"></span>Duplicate",
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
            if (!DATASOURCE.isEditable()) {
                this.get("host").get(BOUNDING_BOX).addClass("wegas-advanced-feature");
            }
        }
    }, {
        NS: "pagetabdisabler"
    });
});
