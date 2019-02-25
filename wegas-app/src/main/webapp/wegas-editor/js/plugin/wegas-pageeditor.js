/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>,
 * Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-pageeditor', function(Y) {
    "use strict";

    var PageEditor, Wegas = Y.Wegas,
        BOUNDINGBOX = "boundingBox", CONTENTBOX = "contentBox",
        Alignable = Y.Base.create("wegas-pageeditor-overlay", Y.Widget, [Y.WidgetPosition, Y.WidgetStack], {}, {
            CSS_PREFIX: "wegas-pageeditor-overlay"
        });
    /**
     *  @class
     *  @name Y.Plugin.PageEditor
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    PageEditor = function() {
        PageEditor.superclass.constructor.apply(this, arguments);
    };
    Y.extend(PageEditor, Y.Plugin.Base, {
        // *** Lifecycle methods *** //
        initializer: function() {
            this.handlers = [];
            this.fixedHandlers = [];
            /**
             * Store user enabled active edition
             */
            this.isActive = false;

            if (!Wegas.Facade.Page.cache.isEditable()) {
                Y.later(100, this.get("host"), function() {
                    this.unplug(PageEditor);
                });
            } else {
                this.afterHostEvent("render", this.render);
            }
        },
        render: function() {
            var host = this.get('host');
            if (host.toolbar) {
                /** Edit page  **/
                this.designButton = host.toolbar.add({
                    type: "ToggleButton",
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span>Edit page",
                    cssClass: "wegas-pageeditor-editbutton"
                }).item(0);
                this.designButton.after("pressedChange", function(e) {
                    host.get(BOUNDINGBOX).toggleClass("wegas-pageeditor-designmode", e.newVal);
                    this.sourceButton.set("visible", e.newVal);
                    this.layoutButton.set("visible", e.newVal);
                    this.addButton.set("visible", e.newVal);
                    //this.refreshButton.set("visible", e.newVal);
                    if (e.newVal) {
                        //Wegas.Facade.Page.cache.getIndex(function(index) {
                        //    var pageName = index[host.get("pageId")] !== ""
                        //            ? index[host.get("pageId")]
                        //            : "<i>unamed(" + host.get("pageId") + ")</i>";
                        //    host.toolbar.setStatusMessage("Editing page: " + pageName);
                        //});
                        this.bind();
                        host.get(CONTENTBOX).prepend(this.overlayMask);
                    } else {
                        this.detachHandlers();
                        host.toolbar.setStatusMessage("");
                        this.overlayMask.remove(false);
                        this.shownOverlay.hide();
                        this.layoutButton.set("pressed", false);
                    }
                }, this);

                /** New button **/
                this.addButton = host.toolbar.add({
                    label: "<span class=\"fa fa-plus-circle\"></span> Add",
                    visible: false
                }).item(0);
                this.addButton.plug(Y.Plugin.WidgetMenu);
                this.addButton.menu.on("menuOpen", function() {
                    var menu = host.get("widget").getMenuCfg({
                        targetwidget: host.get("widget")
                    }), addElement = Y.Array.find(menu, function(o) {           /* search "Add" menu */
                        return o.label.indexOf("Add") > -1;
                    });
                    if (addElement) {
                        this.set("children", addElement.plugins[0].cfg.children);// And place it'
                    } else {
                        this.set("children", []);
                    }
                });

                /** Refresh **/
//                this.refreshButton = host.toolbar.add({
//                    label: "<span class='wegas-icon wegas-icon-pagerefresh'></span>Refresh",
//                    cssClass: "wegas-advanced-feature"
//                }).item(0);
//                this.refreshButton.after("click", function(e) {
//                    this.get("host").reload();
//                }, this);

                this.layoutButton = host.toolbar.add({// Layout
                    type: "ToggleButton",
                    label: "<span class=\"wegas-icon wegas-icon-showregions\"></span>Draw elements</span>",
                    visible: false
                }).item(0);
                this.layoutButton.after("pressedChange", function(e) {
                    host.get(BOUNDINGBOX).toggleClass("wegas-pageeditor-layoutmode",
                        e.newVal);
                });

                /** Source view **/
                this.sourceButton = host.toolbar.add({
                    type: "ToggleButton",
                    label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>Source",
                    visible: false,
                    on: {
                        click: Y.bind(this.processSource, this)
                    }
                }).item(0);

                this.saveButton = host.toolbar.add({
                    label: "<span class=\"wegas-icon wegas-icon-save\"></span>Save",
                    visible: false,
                    on: {
                        click: Y.bind(this.processSave, this)
                    }
                }).item(0);
            }
            this.fixedHandlers.push(this.afterHostEvent("contentUpdated", this.processSource));
            this.highlightOverlay = new Alignable({// Init the highlighting overlay
                zIndex: 30,
                render: true,
                visible: false
            });
            this.shownOverlay = new Alignable({// Init the highlighting overlay
                zIndex: 30,
                render: true,
                visible: false
            });
            this.shownOverlay.get(BOUNDINGBOX).addClass("pageditor-shownoverlay");
            this.highlightOverlay.get(CONTENTBOX).append("<span class='wegas-editmenubutton'></span>");
            this.shownOverlay.get(CONTENTBOX).append("<span class='wegas-editmenubutton-icon'></span>");

            /** MASK **/
            this.overlayMask = new Y.Node.create("<div class='pageeditor-overlay-mask'></div>");
            this.overlayMask.plug(Y.Plugin.WidgetMenu, {
                event: ["click", "contextmenu"]
            });
            this.overlayMask.menu.after("menuOpen", function(e) {
                this.fixedOverlay(this.overlayWidget);
            }, this);
            this.overlayMask.menu.getMenu().set("preventOverlap", false);
            this.overlayMask.append(this.shownOverlay.get(BOUNDINGBOX));
            this.overlayMask.append(this.highlightOverlay.get(BOUNDINGBOX));
            this.fixedHandlers.push(this.doBefore("pageIdChange", function(e) {
                if (this.get("host") === e.target) {
                    this.isActive = this.isActive || this.designButton.get("pressed");
                    this.designButton.set("pressed", false);
                }
            }));
            this.fixedHandlers.push(this.doAfter("contentUpdated", function(e) {
                this.designButton.set("pressed", this.isActive);
                this.isActive = false;
            }));
            this.fixedHandlers.push(host.get(CONTENTBOX).after("mouseout", function(e) {
                if (!PageEditor.inRegion(e.currentTarget, [e.clientX, e.clientY])) {
                    this.hideOverlay();
                }
            }, this));

            host.get(CONTENTBOX).plug(Y.Plugin.ScrollInfo);
            this.fixedHandlers.push(host.get(CONTENTBOX).scrollInfo.on("*:scroll", function(e) {
                this.overlayMask.setStyles({top: e.scrollTop, left: e.scrollLeft});
                if (this.shownOverlay._widget) {
                    this.fixedOverlay(this.shownOverlay._widget);
                }
            }, this));
        },
        bind: function() {
            if (this.binded) {
                return;
            }
            this.binded = true;
            this.handlers.push(this.overlayMask.on("mousemove", function(e) {
                var widget, vis = this.shownOverlay.get("visible");

                e.halt(true);
                this.overlayMask.hide();
                this.highlightOverlay.hide();
                this.shownOverlay.hide();
                widget = Y.Widget.getByNode(Y.Node(window.document.elementFromPoint(e.clientX, e.clientY)).ancestor(".wegas-widget-editable", true));//Find a parent Wegas widget or self
                this.overlayMask.show();
                if (vis) {
                    this.shownOverlay.show();
                }
                if (this.get("host") === widget || widget === null) {
                    return;
                }
                if (widget !== this.overlayWidget) {
                    this.showOverlay(widget);
                } else {
                    this.highlightOverlay.show();
                }
            }, this));
            this.handlers.push(this.overlayMask.menu.on("menuOpen", function(e) {
                if (PageEditor.inRegion(this.shownOverlay.get(CONTENTBOX).one(".wegas-editmenubutton-icon"), [e.domEvent.clientX, e.domEvent.clientY])) { /* Clicked editmenu */
                    this.targetWidget = this.shownOverlay._widget;
                    this.overlayMask.menu.set("children", this.targetWidget.getMenuCfg());
                    this.overlayMask.menu.menu.set("xy", [e.domEvent.clientX, e.domEvent.clientY]);
                    e.halt(true);
                } else if (e.domEvent.type === "contextmenu") {
                    this.targetWidget = this.overlayWidget;
                    this.overlayMask.menu.set("children", this.targetWidget.getMenuCfg());
                    if (this.overlayMask.menu.getMenu().size() > 0) {
                        this.overlayMask.menu.getMenu().item(0).fire("click");
                    }
                    this.overlayMask.menu.menu.set("xy", [e.domEvent.clientX, e.domEvent.clientY]);
                } else {                                                        /* Clicked widget*/
                    this.targetWidget = this.overlayWidget;
                    this.overlayMask.menu.set("children", this.targetWidget.getMenuCfg({
                        widget: this.targetWidget
                    }));
                    this.overlayMask.menu.menu.hide();
                    if (this.overlayMask.menu.getMenu().size() > 0) {
                        this.overlayMask.menu.getMenu().item(0).fire("click");
                    }
                }
            }, this));
            this.handlers.push(Wegas.app.after("layout:resize", function(e) {
                if (this.targetWidget) {
                    this.fixedOverlay(this.targetWidget);
                }
            }, this));
        },
        processSave: function() {
            var host = this.get("host"),
                page;
            try {
                page = Y.JSON.parse(this.jsonView.getValue());
                page["@pageId"] = this.get("host").get("pageId");
            } catch (ex) {
                Y.Widget.getByNode(host.get(BOUNDINGBOX).get("parentNode")).showMessage("error", ex.toString());
                return;
            }
            this.sourceButton.set("pressed", false);
            host.get(CONTENTBOX).show();
            this.jsonView.hide();
            this.designButton.enable();
            this.saveButton.hide();
            host.showOverlay();
            Wegas.Facade.Page.cache.patch(page, Y.bind(function() {
                host.hideOverlay();
                this.reload();
            }, host));
        },
        saveCurrentPage: function() {
            var page = this.get("host").get("widget").toObject();
            page["@pageId"] = this.get("host").get("widget")["@pageId"];
            Wegas.Facade.Page.cache.patch(page);
        },
        processSource: function() {
            var host = this.get("host");
            if (this.sourceButton.get("pressed")) {
                if (!this.jsonView) {
                    this.initJsonView();
                    return;
                }
                this.jsonView.setValue(host.get("widgetCfg"));
                host.get(CONTENTBOX).hide();
                this.jsonView.show();
                this.jsonView.editor.resize();
                this.jsonView.focus();
                this.designButton.disable();
                this.saveButton.show();
            } else {
                host.get(CONTENTBOX).show();
                if (this.jsonView) {
                    this.jsonView.hide();
                }
                this.designButton.enable();
                this.saveButton.hide();
            }
        },
        initJsonView: function() {
            if (!this.jsonView) {
                Y.use("wegas-inputex-ace", Y.bind(function(Y) {
                    this.jsonView = new Y.inputEx.AceField({
                        parentEl: this.get("host").get(BOUNDINGBOX),
                        name: 'text',
                        type: 'ace',
                        height: "100%",
                        language: "json",
                        value: '',
                        wrapperClass: "wegas-pageeditor-ace"
                    });
                    this.jsonView.hide();
                    this.processSource();
                }, this));
            }
        },
        detachHandlers: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
            this.handlers = [];
            this.binded = false;
        },
        showOverlay: function(widget) {
            var targetNode = widget.get(BOUNDINGBOX);
            this.overlayWidget = widget;
            this.highlightOverlay.show();
            this.highlightOverlay.get(BOUNDINGBOX)
                .setXY(targetNode.getXY())
                .setStyles({
                    width: targetNode.getDOMNode().offsetWidth,
                    height: targetNode.getDOMNode().offsetHeight
                });
        },
        fixedOverlay: function(widget) {
            var targetNode = widget.get(BOUNDINGBOX);
            if (!targetNode.getDOMNode()) {
                return;
            }
            this.shownOverlay.get(BOUNDINGBOX)
                .setXY(targetNode.getXY())
                .setStyles({
                    width: targetNode.getDOMNode().offsetWidth,
                    height: targetNode.getDOMNode().offsetHeight
                });
            this.shownOverlay.show();
            if (this.shownOverlay._widget && this.shownOverlay._widget._peDHandle) {
                this.shownOverlay._widget._peDHandle.detach();
                delete this.shownOverlay._widget._peDHandle;
            }
            this.shownOverlay._widget = widget;
            widget._peDHandle = widget.onceAfter("destroy", function(e) {
                if (e.target === this.shownOverlay._widget) {
                    this.shownOverlay._widget = null;
                    this.shownOverlay.hide();
                }
            }, this);
            this.showOverlay(widget);
        },
        hideOverlay: function() {
            this.overlayWidget = null;
            this.highlightOverlay && this.highlightOverlay.hide();
        },
        destructor: function() {
            if (!Wegas.Facade.Page.cache.isEditable()) {
                return;
            }

            this.detachHandlers();
            if (this.shownOverlay) {
                if (this.shownOverlay._widget && this.shownOverlay._widget._peDHandle) {
                    this.shownOverlay._widget._peDHandle.detach();
                    delete this.shownOverlay._widget._peDHandle;
                }
                this.shownOverlay.destroy(true);
            }
            if (this.highlightOverlay) {
                this.hideOverlay();
                this.highlightOverlay.destroy(true);
            }
            if (this.overlayMask) {
                this.overlayMask.destroy(true);
            }


            for (var i = 0; i < this.fixedHandlers.length; i += 1) {
                this.fixedHandlers[i].detach();
            }
            this.jsonView && this.jsonView.destroy();
        },
        _syncWidgetEdition: function(realWidget) {
            var widget = realWidget ?
                (Y.Plugin.EditEntityAction.currentEntity === realWidget ? realWidget : null) :
                (Y.Plugin.EditEntityAction.currentEntity === this.overlayWidget ? Y.Plugin.EditEntityAction.currentEntity : null);
            if (widget) {
                /*
                // This does not work anymore with Form 2.0:
                Y.Plugin.EditEntityAction.form.set("values", widget.toObject());
                Y.Plugin.EditEntityAction.form.syncUI();
                */
                // Simulate a renewed click on the same widget to regenerate the form:
                if (this.overlayMask.menu.getMenu().size() > 0) {
                    Y.later(10, this, function() {
                        this.overlayMask.menu.getMenu().item(0).fire("click");
                    });
                }
            }
        }
    }, {
        NS: "pageeditor",
        NAME: "pageeditor",
        inRegion: function(node, xy) {
            var region = Y.one(node).get("region");
            return xy[0] > region.left && xy[0] < (region.left + region.width) &&
                xy[1] > region.top && xy[1] < (region.top + region.height);
        }
    });
    Y.Base.mix(PageEditor, [Wegas.PageEditorDD, Wegas.PageEditorResize]);       //Enable dragdrop
    Y.Plugin.PageEditor = PageEditor;
});
