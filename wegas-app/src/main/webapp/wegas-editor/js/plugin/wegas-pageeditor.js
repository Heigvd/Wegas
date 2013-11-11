/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>, 
 * Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-pageeditor', function(Y) {
    "use strict";
    var PageEditor, BOUNDINGBOX = "boundingBox",
            CONTENTBOX = "contentBox",
            Alignable = Y.Base.create("wegas-pageeditor-overlay", Y.Widget,
            [Y.WidgetPosition, Y.WidgetStack], {
//CONTENT_TEMPLATE: '<div><span class="wegas-icon wegas-icon-edit"></span><div>'
    }, {
        CSS_PREFIX: "wegas-pageeditor-overlay"
    }),
    inRegion = function(node, xy) {
        var region = Y.one(node).get("region");
        return xy[0] > region.left && xy[0] < (region.left + region.width) &&
                xy[1] > region.top && xy[1] < (region.top + region.height);
    };
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
            if (!Y.Wegas.Facade.Page.cache.editable) {
                Y.later(100, this, function(o, plug) {
                    o.unplug(plug);
                }, [this.get("host"), this.constructor]);
            } else {
                this.afterHostEvent("render", this.render);
            }
        },
        render: function() {
            var el, host = this.get('host');
            if (host.toolbar) {
                el = host.toolbar.get('header');
                this.addButton = new Y.Button({/*@HACK */
                    label: "<span class=\"wegas-icon wegas-icon-new\"></span>New",
                    on: {
                        click: function(e) {
                            var menu = host.get("widget").getMenuCfg({
                                targetwidget: host.get("widget")
                            }), i;
                            for (i = 0; i < menu.length; i += 1) {
                                if (menu[i].label === "Add") {                  /* search "add" menu */
                                    this.menu.set("children", menu[i].plugins[0].cfg.children);
                                    break;
                                }
                            }
                        }
                    }
                }).render(el).plug(Y.Plugin.WidgetMenu);                        /* End @HACK */
                this.designButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span><span class='experimental'>Edit page</span>"
                }).render(el);
                this.fixedHandlers.push(this.designButton.after("pressedChange", function(e) {
                    host.get(BOUNDINGBOX).toggleClass("wegas-pageeditor-designmode",
                            e.newVal);
                    if (e.newVal) {

                        Y.Wegas.Facade.Page.cache.getIndex(function(index) {
                            var pageName = index[host.get("pageId")] !== ""
                                    ? index[host.get("pageId")]
                                    : "<i>unamed(" + host.get("pageId") + ")</i>";
                            host.toolbar.setStatusMessage("Editing page: " + pageName);
                        });
                        this.bind();
                        this.layoutButton.show();
                        host.get(CONTENTBOX).prepend(this.overlayMask);
                    } else {
                        this.detach();
                        host.toolbar.setStatusMessage("");
                        this.overlayMask.remove(false);
                        this.shownOverlay.hide();
                        this.layoutButton.set("pressed", false);
                        this.layoutButton.hide();
                    }
                }, this));
                this.layoutButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span>Draw elements</span>",
                    visible: false
                }).render(el);
                this.fixedHandlers.push(this.layoutButton.after("pressedChange", function(e) {
                    this.get("host").get(BOUNDINGBOX).toggleClass("wegas-pageeditor-layoutmode",
                            e.newVal);
                }, this));
                /*Refresh*/
                this.refreshButton = new Y.Button({
                    label: "<span class='wegas-icon wegas-icon-reset'></span>Refresh"
                }).render(el);
                this.fixedHandlers.push(this.refreshButton.after("click", function(e) {
                    this.get("host").reload();
                }, this));
                /** Source view**/

                this.sourceButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>Source",
                    on: {
                        click: Y.bind(this.processSource, this)
                    }
                }).render(el);
                //this.sourceButton.get(BOUNDINGBOX).addClass("wegas-advanced-feature");

                this.saveButton = new Y.Button({
                    label: "<span class=\"wegas-icon wegas-icon-save\"></span>Save",
                    on: {
                        click: Y.bind(this.processSave, this)
                    }
                }).render(el);
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
                    this.designButton.set("pressed", false);
                }
            }));
            this.fixedHandlers.push(this.get("host").get(CONTENTBOX).after("mouseout", function(e) {
                if (!inRegion(e.currentTarget, [e.clientX, e.clientY])) {
                    this.hideOverlay();
                }
            }, this));

            this.get("host").get(CONTENTBOX).plug(Y.Plugin.ScrollInfo);
            this.fixedHandlers.push(this.get("host").get(CONTENTBOX).scrollInfo.on("*:scroll", function(e) {
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
                widget = Y.Widget.getByNode(//Find a parent Wegas widget or self
                        Y.Node(window.document.elementFromPoint(e.clientX, e.clientY)).ancestor(".wegas-widget", true)
                        );
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
                if (inRegion(this.shownOverlay.get(CONTENTBOX).one(".wegas-editmenubutton-icon"), [e.domEvent.clientX, e.domEvent.clientY])) { /* Clicked editmenu */
                    this.targetWidget = this.shownOverlay._widget;
                    this.overlayMask.menu.set("children", this.targetWidget.getMenuCfg({
                        widget: this.targetWidget
                    }));
                    this.overlayMask.menu.menu.set("xy", [e.domEvent.clientX, e.domEvent.clientY]);
                    e.halt(true);
                } else if (e.domEvent.type === "contextmenu") {
                    this.targetWidget = this.overlayWidget;
                    this.overlayMask.menu.set("children", this.targetWidget.getMenuCfg({
                        widget: this.targetWidget
                    }));
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
        },
        processSave: function() {
            var host = this.get("host"),
                    page;
            try {
                page = Y.JSON.parse(this.jsonView.getValue());
                page["@pageId"] = this.get("host").get("pageId");
            } catch (ex) {
                host.get(BOUNDINGBOX).get("parentNode").emitDOMMessage("error", ex.toString());
                return;
            }
            this.sourceButton.set("pressed", false);
            host.get(CONTENTBOX).show();
            this.jsonView.hide();
            this.designButton.enable();
            this.saveButton.hide();
            //host.get("widget").set("@pageId", host.get("widget")["@pageId"]);
            host.showOverlay();
            Y.Wegas.Facade.Page.cache.patch(page, Y.bind(function() {
                this.reload();
            }, host));
        },
        saveCurrentPage: function() {
            var page = this.get("host").get("widget").toObject();
            page["@pageId"] = this.get("host").get("pageId");
            Y.Wegas.Facade.Page.cache.patch(page);
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
        detach: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
            this.handlers = [];
            this.binded = false;
        },
        showOverlay: function(widget) {
            var targetNode = widget.get(BOUNDINGBOX), bb = this.highlightOverlay.get(BOUNDINGBOX);
            this.overlayWidget = widget;
            this.highlightOverlay.show();
            bb.setXY(targetNode.getXY());
            bb.setStyles({
                width: targetNode.getDOMNode().offsetWidth,
                height: targetNode.getDOMNode().offsetHeight
            });
        },
        fixedOverlay: function(widget) {
            var targetNode = widget.get(BOUNDINGBOX);
            this.shownOverlay.get(BOUNDINGBOX).setXY(targetNode.getXY());
            this.shownOverlay.get(BOUNDINGBOX).setStyles({
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
            if (this.highlightOverlay) {
                this.highlightOverlay.hide();
            }
        },
        destructor: function() {
            var i;
            if (!Y.Wegas.Facade.Page.cache.editable) {
                return;
            }

            this.detach();
            if (this.overlayMask) {
                this.overlayMask.destroy(true);
            }
            if (this.highlightOverlay) {
                this.hideOverlay();
                this.highlightOverlay.destroy(true);
            }
            if (this.shownOverlay) {
                if (this.shownOverlay._widget && this.shownOverlay._widget._peDHandle) {
                    this.shownOverlay._widget._peDHandle.detach();
                    delete this.shownOverlay._widget._peDHandle;
                }
                this.shownOverlay.destroy(true);
            }
            for (i = 0; i < this.fixedHandlers.length; i += 1) {
                this.fixedHandlers[i].detach();
            }
            this.fixedHandlers = [];
            if (this.designButton) {
                this.designButton.destroy(true);
            }
            if (this.addButton) {
                this.addButton.destroy(true);
            }
            if (this.layoutButton) {
                this.layoutButton.destroy(true);
            }
            if (this.refreshButton) {
                this.refreshButton.destroy(true);
            }
            if (this.sourceButton) {
                this.sourceButton.destroy(true);
            }
            if (this.saveButton) {
                this.saveButton.destroy(true);
            }
            if (this.jsonView) {
                this.jsonView.destroy();
            }
        },
        _syncWidgetEdition: function() {
            var widget = Y.Plugin.EditEntityAction.currentEntity === this.overlayWidget ? Y.Plugin.EditEntityAction.currentEntity : null;
            if (widget) {
                Y.Plugin.EditEntityAction.form.set("values", widget.toObject());
                Y.Plugin.EditEntityAction.form.syncUI();
            }
        }

    }, {
        NS: "pageeditor",
        NAME: "pageeditor",
        ATTRS: {}
    });
    Y.Base.mix(PageEditor, [Y.Wegas.PageEditorDD, Y.Wegas.PageEditorResize]); //Enable dragdrop
    Y.namespace('Plugin').PageEditor = PageEditor;
});
