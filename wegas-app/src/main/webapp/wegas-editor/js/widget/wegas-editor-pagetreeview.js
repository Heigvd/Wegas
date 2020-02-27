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

    function getAddBtnMenuItems(path) {
        return [
            {
                type: 'AddPageIndexItemButton',
                label: '<span class="fa fa-folder-o"> </span> Folder',
                cssClass: 'border-bottom',
                targetClass: 'PageFolderMeta',
                path: path
            },
            {
                type: 'AddPageIndexItemButton',
                label: '<span class="fa fa-list"> </span> Standard (List layout)',
                targetClass: 'PageMeta',
                path: path,
                cfg: {
                    type: 'FlexList'
                }
            },
            {
                type: 'AddPageIndexItemButton',
                label: '<span class="fa fa-picture-o"> </span> Beginner (Absolute layout)',
                targetClass: 'PageMeta',
                path: path,
                cfg: {
                    type: 'AbsoluteLayout'
                }
            }
        ];
    }

    function getPageMenuItems(treeView, data) {
        return [{
                type: "Button",
                label: "Edit",
                on: {
                    click: Y.bind(treeView.editPageMeta, treeView, data)
                }
            },
            {
                type: "Button",
                label: "Set as default",
                on: {
                    click: Y.bind(treeView.setAsDefaultPage, treeView, data.page)
                }
            },
            {
                type: "Button",
                label: "Duplicate",
                on: {
                    click: Y.bind(treeView.duplicatePage, treeView, data.page)
                }
            },
            {
                type: "Button",
                label: "Delete",
                on: {
                    click: Y.bind(treeView.deletePage, treeView, data.page)
                }
            }];
    }


    var AddPageIndexItemButton = Y.Base.create("AddPageIndexItemButton", Y.Wegas.Button, [], {
        initializer: function() {
            AddPageIndexItemButton.superclass.initializer.apply(this, arguments);
            this.onClickHandler = this.on("click", this.onClick, this);
        },
        destructor: function() {
            this.onClickHandler && this.onClickHandler;
        },
        showAddForm: function(entity) {
            Y.Plugin.EditEntityAction.showEditForm(entity, Y.bind(function(newVal) {
                newVal["@class"] = (this.get("targetClass") === "PageMeta" ? "Page" : "Folder");

                var data = {
                    path: this.get("path") || [],
                    item: newVal,
                    payload: this.get("cfg")
                };
                Y.Wegas.Facade.Page.cache.createIndexItem(data);
            }, this));
        },
        onClick: function() {
            Plugin.EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                Y.Wegas.Editable.useAndRevive(Y.merge({// Load target class dependencies
                    "@class": this.get("targetClass")
                }, Y.clone(this.get("cfg"))), Y.bind(function(entity) {
                    this.showAddForm(entity);
                }, this));
            }, this));
        }
    }, {
        NS: "AddEntityChildAction",
        ATTRS: {
            targetClass: {
                type: 'string'
            },
            cfg: {},
            path: {
                type: 'array'
            }
        }
    });
    Y.Wegas.AddPageIndexItemButton = AddPageIndexItemButton;

    var SetPageAsDefaultButton = Y.Base.create("SetPageAsDefault", Y.Wegas.Button, [], {
        initializer: function() {
            SetPageAsDefaultButton.superclass.initializer.apply(this, arguments);
            this.onClickHandler = this.on("click", this.onClick, this);
        },
        destructor: function() {
            this.onClickHandler && this.onClickHandler;
        },
        onClick: function() {
        }
    }, {
        NS: "SetPageAsDefault",
        ATTRS: {
        }
    });
    Y.Wegas.AddPageIndexItemButton = AddPageIndexItemButton;






    PageTreeview = Y.Base.create("wegas-editor-page", Y.Widget, [Wegas.Widget, Wegas.Editable, Y.WidgetChild], {
        renderUI: function() {
            this.treeView = new Y.TreeView().render(this.get(CONTENT_BOX)); // Render the treeview
            //this.treeView.get("contentBox").addClass("index-folder");
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
                            nodeClass: "index-item",
                            parentNode: ["index-folder", "yui3-treeview"]
                        }]
                });

                var header = this.toolbar.get("header");
                this.btnNew = new Y.Button({
                    label: "<span class=\"fa fa-plus-circle\"></span> New page"
                }).render(header);

                this.btnReload = new Y.Button({
                    label: "<span class=\"fa fa-refresh\"></span>",
                    on: {
                        click: Y.bind(this.getIndex, this)
                    }
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

                    var data = e.dragWidget.get("data");
                    if (data.page || data.folder) {
                        // index update
                        var destData = e.dropWidget.get("data");
                        var destPath = destData && destData.path || [];
                        DATASOURCE.move(data.path, destPath, e.index);

                    } else if (e.dropWidget.get("data.widget")) {
                        // move widget
                        if (e.dropWidget.get(BOUNDING_BOX).hasClass("container-node")) {
                            Y.log("MOVE WIDGET")
                            e.dropWidget.get("data.widget").add(e.dragWidget.get("data.widget"), e.index);
                            DATASOURCE.patch(e.dropWidget.get("data.widget").get("root").toObject());
                        } else {
                            e.preventDefault();
                            this.getIndex();
                        }
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
                    if (!this.focusedOverlay) {
                        this.focusedOverlay = new Y.Overlay({
                            zIndex: 9999,
                        }).render();

                        this.focusedOverlay.get(BOUNDING_BOX).addClass("wegas-focused-widget");
                    }
                    var rect = node.get("data.widget").get(BOUNDING_BOX).getDOMNode();
                    rect = rect && rect.getBoundingClientRect();
                    if (rect) {
                        this.focusedOverlay.set("x", rect.x);
                        this.focusedOverlay.set("y", rect.y);
                        this.focusedOverlay.set("width", rect.width);
                        this.focusedOverlay.set("height", rect.height);
                        this.focusedOverlay.show();
                    } else {
                        this.focusedOverlay.hide();
                    }
                }
            }, ".content-header", this);

            this.treeView.get(CONTENT_BOX).delegate("mouseleave", function(e) {
                e.halt(true);
                this.focusedOverlay && this.focusedOverlay.hide();
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
                var pageId = e.entity instanceof Y.Wegas.persistence.PageMeta && e.entity.get("id");
                var isFolder = e.entity instanceof Y.Wegas.persistence.PageFolderMeta;
                var path = e.entity.get("path")

                var cur = this.treeView.find(function(item) {
                    var data = item.get("data");
                    if (pageId && data && data.page && data.page.id === pageId) {
                        return true;
                    } else if (isFolder) {
                        // folder must have the same path
                        if (data && data.path && path) {
                            if (data.path.length === path.length) {
                                for (var i = 0; i < path.length; i++) {
                                    if (data.path[i] !== path[i]) {
                                        return false;
                                    }
                                }
                                return true;
                            } else {
                                return false;
                            }
                        }
                        return false;
                    } else {
                        return item.get("data.widget") ?
                            item.get("data.widget")._yuid === e.entity._yuid :
                            false;
                    }
                });

                this.treeView.deselectAll();

                if (cur) {
                    this.selectItem(cur)
                }
            }, this));

            this.handlers.push(Y.after("edit-entity:cancel", function(e) {
                this.selectItem(null);
            }, this));

            if (this.btnNew) {
                // Initialize the 'New page' button menu :
                this.btnNew.plug(Plugin.WidgetMenu, {
                    children: getAddBtnMenuItems([])
                });
            }
        },
        selectItem: function(item) {
            if (item) {
                item.expandParents();
                item.set("selected", 2);
            } else {
                this.treeView.set("selected", 0);
            }
        },
        newFolder: function(cfg, event) {
            DATASOURCE.createFolder(cfg, Y.bind(function() {

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
        buildSubTree: function(widget) {
            var selected;

            if (!widget || typeof widget.getMenuCfg !== "function" || !widget.get("editable")) {
                Y.log(widget + " not editable", "warn", "Y.Wegas.PageEditorTreeView");
                return;
            }
            selected = widget.get("boundingBox").hasClass("highlighted") ? 2 : 0;
            if (widget.isAugmentedBy(Wegas.Parent)) {

                var children = [];
                widget.each(function(item) {
                    children.push(this.buildSubTree(item));
                }, this);

                return {
                    type: 'TreeNode',
                    label: widget.getEditorLabel() || "<i>" + widget.getType() + "</i>",
                    tooltip: "Type: " + widget.getType(),
                    children: children,
                    selected: selected,
                    data: {
                        widget: widget
                    },
                    cssClass: "container-node widget-node",
                    iconCSS: "wegas-icon-" + Wegas.Helper.escapeCSSClass(widget.getType())
                };
            } else {
                return {
                    type: 'TreeLeaf',
                    label: widget.getEditorLabel() || ("<i>" + widget.getType() + "</i>"),
                    tooltip: "Type: " + widget.getType(),
                    selected: selected,
                    data: {
                        widget: widget
                    },
                    cssClass: "widget-node",
                    iconCSS: "wegas-icon-" + Wegas.Helper.escapeCSSClass(widget.getType())
                };
            }
        },
        updateWidget: function(e) {
            var widget = e.target || e.currentTarget; // currentTarget is the page, target the widget
            var currentNode;

            // fetch the node whom the updated child belongs
            currentNode = this.treeView.find(function(item) {
                if (item.get("data.widget")) {
                    return item.get("data.widget") === widget;
                }
            });

            if (currentNode) {
                var state = this.treeView.saveState();
                var scrollTop = this.get("contentBox").getDOMNode().scrollTop;
                currentNode.destroyAll();
                currentNode.get("boundingBox").addClass("no-transition");

                var newTree = this.buildSubTree(widget);
                currentNode.add(newTree.children);

                this.reinitListener(widget);
                this.initListeners(currentNode);

                this.treeView.applyState(state);

                this.get("contentBox").getDOMNode().scrollTop = scrollTop;

                // transitoin duration definee in treeview.css: 150ms
                Y.later(5, currentNode, function() {
                    this.get("boundingBox").removeClass("no-transition");
                });
            } else {
                // node not found:  update whole treeview
                this.getIndex();
            }
        },
        _addChild: function(e) {
            this.updateWidget(e);
        },
        _removeChild: function(e) {
            Y.later(0, this, this.updateWidget, e);
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
                this.reinitListener(node.item(0).get("data.widget"));
            }
        },
        reinitListener: function(widget) {
            if (widget) {
                widget.detach("*:addChild", this._addChild, this);
                widget.onceAfter("*:addChild", this._addChild, this);

                widget.detach("*:removeChild", this._removeChild, this);
                widget.onceAfter("*:removeChild", this._removeChild, this);
            }
        },
        initListeners: function(root) {
            root.get("contentBox").all(".widget-node").each(function(widgetNode) {
                var leaf = Y.Widget.getByNode(widgetNode);
                if (leaf) {
                    this.reinitListener(leaf.get("data.widget"));
                }
            }, this);
        },
        _genTree: function(item, displayedPage, defaultPage, pageWidget, path) {
            var currentPath = path ? path.slice() : [];

            if (item.items) {
                // folder
                if (item.name != undefined) {
                    // skip root
                    currentPath.push(item.name);
                }
                var children = [];
                var i;

                for (i in item.items) {
                    children.push(this._genTree(item.items[i], displayedPage, defaultPage, pageWidget, currentPath));
                }
                return {
                    type: 'TreeNode',
                    label: item.name || "Folder",
                    children: children,
                    data: {
                        path: currentPath,
                        folder: item
                    },
                    cssClass: "index-folder index-item",
                    iconCSS: 'fa fa-folder'
                };
            } else if (item.id) {
                currentPath.push(item.id);
                var node = {
                    type: 'TreeLeaf',
                    label: (item.name ? item.name : "<i>Unnamed</i>") + " (" + item.id + ")",
                    data: {
                        path: currentPath,
                        page: item
                    },
                    cssClass: "index-item",
                    iconCSS: "fa fa-file"
                };

                if (item.id === defaultPage) {
                    node.cssClass += " default-page";
                }

                if (item.id === displayedPage) {
                    node.type = 'TreeNode';
                    node.cssClass += " current-page";
                    node.collapsed = false;
                    node.children = this.buildSubTree(pageWidget);
                }
                return node;
            }
        },
        buildIndex: function(index) {
            var twState,
                pageId,
                pageWidget;

            if (this.get("pageLoader")) {
                pageId = this.get("pageLoader")._pageId;
                pageWidget = this.get("pageLoader").get("widget");
            }

            if (pageId === 'default') {
                pageId = index.defaultPageId;
            }

            twState = this.treeView.saveState();
            this.showOverlay();
            this.treeView.destroyAll();

            this.treeView.add(this._genTree(index.root, pageId, index.defaultPageId, pageWidget).children);
            this.initListeners(this.treeView);

            this.treeView.applyState(twState);

            this.selectItem(this.treeView.find(function(item) {
                return item && item.get("data.page.id") === pageId;
            }));

            this.hideOverlay();
        },
        setAsDefaultPage: function(page) {
            DATASOURCE.setDefaultPage(page.id, Y.bind(this.buildIndex, this));
        },
        editPageMeta: function(data) {
            var thePage = new Wegas.persistence.PageMeta(data.page);
            var form = Plugin.EditEntityAction.showEditForm(thePage,
                Y.bind(function(value) {
                    Plugin.EditEntityAction.hideEditFormOverlay();
                    DATASOURCE.updateIndexItem(data.path, value, Y.bind(this.buildIndex, this));
                }, this));

            var menu = getPageMenuItems(this, data).slice(1);
            Plugin.EditEntityAction.processMenu(menu, thePage);
            form.toolbar.add(menu);
        },
        editFolderMeta: function(data) {
            var folder = new Wegas.persistence.PageFolderMeta({
                "@class": "Folder",
                name: data.folder.name,
                id: data.folder.name,
                items: data.folder.items,
                path: data.path
            });
            var form = Plugin.EditEntityAction.showEditForm(folder,
                Y.bind(function(value) {
                    Plugin.EditEntityAction.hideEditFormOverlay();
                    delete value["@path"];
                    delete value["items"];
                    delete value["id"];
                    DATASOURCE.updateIndexItem(data.path, value, Y.bind(this.buildIndex, this));
                }, this));

            var menu = [{
                    type: "Button",
                    label: "Add",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                children: getAddBtnMenuItems(data.path)
                            }
                        }]
                }];

            Plugin.EditEntityAction.processMenu(menu, folder);
            form.toolbar.add(menu);
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
                page, widget, folder;
            if (Y.Lang.isUndefined(data)) {
                return;
            }
            page = data.page;
            widget = data.widget;
            folder = data.folder;

            if (page) {
                this.get(HOST).changePage(page.id, Y.bind(function(widget) {
                    PageTreeviewToolbarMenu.superclass.onTreeViewSelection.call(this, e);
                }, this));
            } else if (folder) {
                PageTreeviewToolbarMenu.superclass.onTreeViewSelection.call(this, e);
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
            if (data.page) {
                // Add page edit, copy and delete buttons
                menuItems = getPageMenuItems(host, data);
            } else if (data.widget) {
                menuItems = PageTreeviewToolbarMenu.superclass.getMenuItems.call(this, data);
                if (data.widget === data.widget.get("root")) {
                    menuItems.splice(menuItems.length - 2, 2); // Remove widget delete, copy button
                }
            } else if (data.folder) {
                menuItems = [{
                        type: "Button",
                        label: "<span class=\"wegas-icon wegas-icon-edit\"></span>Edit",
                        on: {
                            click: Y.bind(host.editFolderMeta, host, data)
                        }
                    },
                    {
                        type: "Button",
                        label: "Add",
                        plugins: [{
                                fn: "WidgetMenu",
                                cfg: {
                                    children: getAddBtnMenuItems(data.path)
                                }
                            }]
                    }
                ];

            }
            return menuItems;
        }
    }, {
        NS: "menu"
    });

    PageTreeViewContextMenu = Y.Base.create("admin-menu", Plugin.EditorTVContextMenu, [], {
        onTreeViewClick: function(e) {
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
