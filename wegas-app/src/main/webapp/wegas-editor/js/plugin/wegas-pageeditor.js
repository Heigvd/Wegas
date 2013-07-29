/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
            this.afterHostEvent("render", this.render);
            this.handlers = [];
            this.fixedHandlers = [];
        },
        render: function() {
            var el, host = this.get('host');

            if (host.toolbar) {
                el = host.toolbar.get('header');
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
                        this.layoutbutton.show();
                        host.get(CONTENTBOX).prepend(this.overlayMask);
                    } else {
                        this.detach();
                        host.toolbar.setStatusMessage("");
                        this.overlayMask.remove(false);
                        this.highlightOverlay.hide();
                        this.layoutbutton.set("pressed", false);
                        this.layoutbutton.hide();
                    }
                }, this));
                this.layoutbutton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span>Draw elements</span>",
                    visible: false
                }).render(el);
                this.fixedHandlers.push(this.layoutbutton.after("pressedChange", function(e) {
                    this.get("host").get(BOUNDINGBOX).toggleClass("wegas-pageeditor-layoutmode",
                            e.newVal);
                }, this));
                /*Refresh*/
                this.refreshButton = new Y.Button({
                    label:"<span class='wegas-icon wegas-icon-reset'></span>Refresh"
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
            this.highlightOverlay.get(CONTENTBOX).append("<div class='overlay-label'></div>");
            this.highlightOverlay.get(CONTENTBOX).append("<span class='wegas-editmenubutton'></span>");
            this.overlayMask = new Y.Node.create("<div class='pageeditor-overlay-mask'></div>");
            this.overlayMask.plug(Y.Plugin.WidgetMenu, {
                event: "click"
            });
            this.get("host").get(BOUNDINGBOX).prepend(this.highlightOverlay.get(BOUNDINGBOX));
            host.get(CONTENTBOX).plug(Y.Plugin.ScrollInfo);
            this.fixedHandlers.push(this.doBefore("pageIdChange", function() {
                this.designButton.set("pressed", false);
            }));
            this.anim = new Y.Anim({
                node: this.highlightOverlay.get(BOUNDINGBOX),
                duration: 0.15
            });
            this.fixedHandlers.push(this.get("host").get(CONTENTBOX).after("mouseout", function() {
                this.hideOverlay();
            }, this));
            this.fixedHandlers.push(this.get("host").get(CONTENTBOX).scrollInfo.on("*:scroll", function(e) {
                this.overlayMask.setStyles({top: e.scrollTop, left: e.scrollLeft});
            }, this));

        },
        bind: function() {
            if (this.binded) {
                return;
            }
            this.binded = true;

            this.handlers.push(this.overlayMask.menu.on("menuOpen", function(e) {
                if (!this.highlightOverlay.get("visible")) {
                    this.overlayMask.menu.menu.hide();
                    return;
                }
                this.targetWidget = this.overlayWidget;
                this.overlayMask.menu.set("children", this.targetWidget.getMenuCfg({
                    widget: this.targetWidget
                }));
                if (inRegion(this.highlightOverlay.get(CONTENTBOX).one(".wegas-editmenubutton"), [e.domEvent.clientX, e.domEvent.clientY])) { /* Clicked editmenu */
                    this.overlayMask.menu.menu.set("xy", [e.domEvent.clientX, e.domEvent.clientY]);
                } else {                                                        /* Clicked widget*/
                    this.overlayMask.menu.menu.hide();
                    if (this.overlayMask.menu.getMenu().size() > 0) {
                        this.overlayMask.menu.getMenu().item(0).fire("click");
                    }
                }
            }, this));

            this.handlers.push(this.overlayMask.on("mousemove", function(e) {
                var widget;
                e.halt(true);
                this.overlayMask.hide();
                this.highlightOverlay.hide();
                widget = Y.Widget.getByNode(//Find a parent Wegas widget or self
                        Y.Node(window.document.elementFromPoint(e.clientX, e.clientY)).ancestor(".wegas-widget", true)
                        );
                this.overlayMask.show();
                if (this.get("host") === widget) {
                    return;
                }
                if (this.overlayWidget !== widget) {
                    this.showOverlay(widget);
                } else {
                    this.highlightOverlay.show();
                }
            }, this));

        },
        processSave: function() {
            var host = this.get("host"),
                    page;
            try {
                page = Y.JSON.parse(this.jsonView.getValue());
                page["@pageId"] = this.get("host").get("pageId");
            } catch (e) {
                host.get(BOUNDINGBOX).get("parentNode").emitDOMMessage("error", e.toString());
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
        showOverlay: function(widget, immediate) {
            var targetNode = widget.get(BOUNDINGBOX), bb = this.highlightOverlay.get(BOUNDINGBOX);
            this.overlayWidget = widget;
            this.anim.stop();
            this.highlightOverlay.show();
            if (this.runTimeout) {
                this.runTimeout.cancel();
            }
            if (!immediate) {

                this.runTimeout = Y.later(100, this, function() {
                    try {
                        this.highlightOverlay.get(CONTENTBOX).one(".overlay-label").setContent(widget.getName());
                        this.anim.set("from", {
                            xy: bb.getXY(),
                            width: bb.getDOMNode().offsetWidth,
                            height: bb.getDOMNode().offsetHeight
                        });
                        this.anim.set("to", {
                            xy: targetNode.getXY(),
                            width: targetNode.getDOMNode().offsetWidth,
                            height: targetNode.getDOMNode().offsetHeight
                        });
                        this.anim.run();
                    } catch (e) {
                    }
                });
            } else {
                this.highlightOverlay.get(BOUNDINGBOX).setXY(targetNode.getXY());
                this.highlightOverlay.get(BOUNDINGBOX).setStyles({
                    width: widget.get(BOUNDINGBOX).getDOMNode().offsetWidth,
                    height: widget.get(BOUNDINGBOX).getDOMNode().offsetHeight
                });
            }
        },
        hideOverlay: function() {
            this.overlayWidget = null;
            this.highlightOverlay.hide();
        },
        destructor: function() {
            var i;
            this.hideOverlay();
            this.detach();
            this.anim.destroy();
            this.overlayMask.destroy(true);
            this.highlightOverlay.destroy(true);
            for (i = 0; i < this.fixedHandlers.length; i += 1) {
                this.fixedHandlers[i].detach();
            }
            this.fixedHandlers = [];
            if (this.designButton) {
                this.designButton.destroy(true);
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
        }

    }, {
        NS: "pageeditor",
        NAME: "pageeditor",
        ATTRS: {}
    });
    Y.Base.mix(PageEditor, [Y.Wegas.PageEditorDD, Y.Wegas.PageEditorResize]);   //Enable dragdrop
    Y.namespace('Plugin').PageEditor = PageEditor;

});
