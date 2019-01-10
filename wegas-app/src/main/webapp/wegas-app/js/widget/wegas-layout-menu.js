/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Maxence
 */
YUI.add('wegas-layout-menu', function(Y) {
    "use strict";
    var BOUNDINGBOX = 'boundingBox',
        CONTENTBOX = 'contentBox',
        LayoutMenu,
        I18nMenu;

    LayoutMenu = Y.Base.create("wegas-layout-menu", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        BOUNDING_TEMPLATE:
            '<div>'
            + '<div class="wegas-layout-menu-label">'
            + '<div class="overlay"></div>'
            + '<div class="clone"></div>'
            + '</div>'
            + '</div>',
        CONTENT_TEMPLATE: "<div class='wegas-layout-menu-content'></div>",
        initializer: function() {
            this.handlers = {};
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.resizeObserver && this.resizeObserver.disconnect();
            this._windowResizeCb && window.removeEventListener("resize", this._windowResizeCb);


            if (this.clonedLabel) {
                this.clonedLabel.destroy();
            }
        },
        renderUI: function() {
            this.checkDisplayMode();
        },
        checkDisplayMode: function() {
            if (this.isSubmenu()) {
                this.setDisplayMode("menu");
            } else {
                this.setDisplayMode(this.get("defaultDisplayMode"));
            }
        },
        syncUI: function() {
            var bb = this.get(BOUNDINGBOX);
            this.syncLabel();
            this.rebindUI();
        },
        bindUI: function() {
            this.handlers.selectionListener = this.on("*:selectedChange", this.syncLabel, this);
            if (!this.isSubmenu() && this.get("defaultDisplayMode") === "inline") {
                this.initReqSize();

                if (window.ResizeObserver !== undefined) {
                    this.resizeObserver = new ResizeObserver(Y.bind(this.resizeListener, this));
                    this.resizeObserver.observe(this._getTargetNode());
                } else {
                    // rely on document resize and layout-resize
                    this._windowResizeCb = Y.bind(this.legacyListener, this);
                    window.addEventListener("resize", this._windowResizeCb);
                    this.handlers.layoutResize = Y.Wegas.app.on("layout:resize", Y.bind(this.legacyListener, this));
                }
            }
        },
        initReqSize: function() {
            var cb = this.get(CONTENTBOX);
            this.reqSize = 0;
            cb.all("> *").each(function(child) {
                this.reqSize += child.getDOMNode().getBoundingClientRect().width;
            }, this);

            this.reqSize *= 1.1;

        },
        checkSize: function(newRect) {
            if (this.get("destroyed") || !this.get("initialized")) {
                return;
            }
            var newMode;
            if (newRect.width < this.reqSize) {
                newMode = "select";
            } else {
                newMode = "inline";
            }

            if (this.effectiveDisplayMode !== newMode) {
                this.setDisplayMode(newMode);
                // click or mouseenter for first level submenu ?
                this.rebindSubmenus();
            }

        },
        _getTargetNode: function() {
            return this.get("boundingBox").getDOMNode();
        },
        legacyListener: function(e) {
            var node = this._getTargetNode();
            this.checkSize(node.getBoundingClientRect());
        },
        resizeListener: function(entries) {
            for (var i in entries) {
                var entry = entries[i];
                this.checkSize(entry.contentRect);
            }
        },
        rebindUI: function() {
            var bb = this.get(BOUNDINGBOX);
            var event = this.isSubmenu() && this.isParentNotInline() ? "mouseenter" : "click";
            if (this.openListener) {
                this.openListener.detach();
            }
            this.openListener = bb.delegate(event, this.open, "> .wegas-layout-menu-label", this);
        },
        rebindSubmenus: function(e) {
            this.get(CONTENTBOX).all(".wegas-layout-menu").each(function(submenu) {
                Y.Widget.getByNode(submenu).rebindUI();
            }, this);
        },
        closeChildren: function(e) {
            var submenus = this.get(CONTENTBOX).all(".wegas-layout-menu-open");
            submenus.each(function(submenu) {
                Y.Widget.getByNode(submenu).close();
            }, this);
        },
        close: function(e) {
            var bb = this.get(BOUNDINGBOX);
            bb.toggleClass("wegas-layout-menu-open", false);
            Y.later(0, this, this.syncLabel);
            if (this.handlers.closeListener) {
                this.handlers.closeListener.detach();
                delete this.handlers.closeListener;
                this.handlers.closeListener2.detach();
                delete this.handlers.closeListener2;
            }
        },
        open: function(e) {
            var bb = this.get(BOUNDINGBOX);

            if (this.isSubmenu()) {
                this.get("parent").closeChildren();
            }

            bb.toggleClass("wegas-layout-menu-open", true);
            Y.later(0, this, function() {
                if (this.isSubmenu()) {
                    var subMenu = this.get("contentBox");
                    if (this.isParentNotInline()) {
                        var menuRect = this.get("boundingBox").getDOMNode().getBoundingClientRect();
                        var subMenuRect = subMenu.getDOMNode().getBoundingClientRect();

                        subMenu.setStyle("top", menuRect.top);
                        if (menuRect.right + subMenuRect.width < window.innerWidth) {
                            // one the right
                            subMenu.setStyle("left", menuRect.right);
                        } else {
                            // one the left
                            subMenu.setStyle("left", menuRect.left - subMenuRect.width);
                        }
                    } else {
                        subMenu.setStyle("top", null);
                        subMenu.setStyle("left", null);
                    }
                }
            });

            if (!this.handlers.closeListener) {
                this.handlers.closeListener = bb.on("clickoutside", this.close, this);
                this.handlers.closeListener2 = bb.on("click", this.close, this);
            }
        },
        getSelected: function() {
            var cb = this.get(CONTENTBOX);
            var selectedChild = cb.one("> [class*='-selected']");
            if (selectedChild) {
                var widget = Y.Widget.getByNode(selectedChild);
                if (widget !== this && widget instanceof LayoutMenu) {
                    return widget.getSelected();
                }
                return selectedChild;
            }
        },
        syncLabel: function() {
            var bb = this.get(BOUNDINGBOX);
            if (this.effectiveDisplayMode !== "menu") {
                var selected = this.getSelected();
                if (selected) {
                    var selectedCfg = Y.Widget.getByNode(selected).toObject();
                    selectedCfg.editable = false;
                    var cloneNode = bb.one(".wegas-layout-menu-label .clone");
                    cloneNode.setContent();
                    if (this.clonedLabel) {
                        this.clonedLabel.destroy();
                    }
                    this.clonedLabel = Y.Wegas.Widget.create(selectedCfg).render(cloneNode);
                    return;
                }
            } else {
                bb.one(".wegas-layout-menu-label .clone").setContent(this.getLabel());
            }
        },
        setDisplayMode: function(dMode) {
            this.effectiveDisplayMode = dMode;
            var bb = this.get(BOUNDINGBOX);
            var choices = LayoutMenu.ATTRS.defaultDisplayMode.view.choices;
            for (var i in choices) {
                var item = choices[i];
                bb.toggleClass("wegas-layout-menu-" + item, item === dMode);
            }
        },
        getLabel: function() {
            if (this.get("label")) {
                var labelDesc = this.get("label.evaluated");
                if (labelDesc instanceof Y.Wegas.persistence.ListDescriptor) {
                    return I18n.t(labelDesc.getLabel());
                } else {
                    return labelDesc.getInstance().get("value");
                }
            } else {
                return this.get("name");
            }
        },
        getEditorLabel: function() {
            return Y.Wegas.Helper.stripHtml(this.get("name"));
        },
        isParentNotInline: function() {
            return this.get("parent").effectiveDisplayMode !== "inline";
        },
        isSubmenu: function() {
            return this.get("parent") && this.get("parent") instanceof LayoutMenu;
        }
    }, {
        /** @lends Y.Wegas.List */
        EDITORNAME: "LayoutMenu",
        CSS_PREFIX: "wegas-layout-menu",
        ATTRS: {
            defaultDisplayMode: {
                value: 'inline',
                type: "string",
                view: {
                    label: "Display Mode",
                    type: 'select',
                    choices: ['inline', 'select', 'menu']
                }
            },
            label: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Label',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            },
            name: {
                value: "menu",
                type: "string",
                view: {
                    label: "Name"
                }
            }
        },
        EDITMENU: {
            addBtn: {
                index: 1,
                maxVisibility: "PROTECTED",
                cfg: {
                    type: "button",
                    label: "Add",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                children: [{
                                        type: "button",
                                        label: "Submenu",
                                        plugins: [{
                                                fn: "AddChildWidgetAction",
                                                cfg: {
                                                    childType: "LayoutMenu"
                                                }
                                            }
                                        ]
                                    }, {
                                        type: "button",
                                        label: "Language Selection Menu",
                                        plugins: [{
                                                fn: "AddChildWidgetAction",
                                                cfg: {
                                                    childType: "I18nMenu"
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        type: "button",
                                        label: "Text",
                                        plugins: [{
                                                fn: "AddChildWidgetAction",
                                                cfg: {
                                                    childType: "TextTemplate"
                                                }
                                            }]
                                    }, {
                                        type: "custom",
                                        label: "Custom",
                                        plugins: [{
                                                fn: "AddChildWidgetAction",
                                                cfg: {
                                                    childType: "Template"
                                                }
                                            }]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    });
    Y.Wegas.LayoutMenu = LayoutMenu;


    I18nMenu = Y.Base.create("wegas-i18n-menu", Y.Wegas.LayoutMenu, [], {
        toObject: function() {
            return Y.Wegas.Editable.prototype.toObject.apply(this, arguments);
        },
        renderUI: function() {
            this.destroyAll();
            var languages = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("activeLanguages");
            for (var i in languages) {
                var item = languages[i];
                var btn = new Y.Wegas.Text({
                    content: (I18n.getCode() === item.get("code").toUpperCase() ? "<b>" + item.get("lang") + "</b>" : item.get("lang")),
                });
                btn.plug(Y.Plugin.ExecuteLocalScriptAction, {
                    "targetEvent": "click",
                    "onClick": "I18n.setCurrentPlayerCode('" + item.get("code") + "');"
                });
                this.add(btn);
            }
            return I18nMenu.superclass.renderUI.apply(this, arguments);
        }
    }, {
        ATTRS: {
            name: {
                value: "language",
                type: "string",
                view: {
                    label: "Name"
                }
            }

        },
        EDITMENU: {
            addBtn: null
        }
    });
    Y.Wegas.I18nMenu = I18nMenu;
});
