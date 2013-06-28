/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
            [Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack], {
        //CONTENT_TEMPLATE: '<div><span class="wegas-icon wegas-icon-edit"></span><div>'
    }, {
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
            this.afterHostEvent("render", this.render);
            this.handlers = [];
        },
        render: function() {
            var el, host = this.get('host');

            if (host.toolbar) {
                el = host.toolbar.get('header');
                this.designButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span><span class='experimental'>Edit page</span>"
                }).render(el);
                this.designButton.after("pressedChange", function(e) {
                    this.get("host").get(BOUNDINGBOX).toggleClass("wegas-pageeditor-designmode",
                            e.newVal);
                    if (e.newVal) {
                        this.bind();
                        this.layoutbutton.show();
                        this.get("host").get(CONTENTBOX).prepend(this.overlayMask);
                    } else {
                        this.detach();
                        this.overlayMask.remove(false);
                        this.highlightOverlay.hide();
                        this.layoutbutton.set("pressed", false);
                        this.layoutbutton.hide();
                    }
                }, this);
                this.layoutbutton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span>Show regions</span>",
                    visible: false
                }).render(el);
                this.layoutbutton.after("pressedChange", function(e) {
                    this.get("host").get(BOUNDINGBOX).toggleClass("wegas-pageeditor-layoutmode",
                            e.newVal);
                }, this);

                /** Source view**/

                this.sourceButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>Source",
                    on: {
                        click: Y.bind(this.processSource, this)
                    }
                }).render(el);
                //this.sourceButton.get("boundingBox").addClass("wegas-advanced-feature");
                this.afterHostEvent("widgetChange", this.processSource);

                this.saveButton = new Y.Button({
                    label: "<span class=\"wegas-icon wegas-icon-save\"></span>Save",
                    on: {
                        click: Y.bind(this.processSave, this)
                    }
                }).render(el);
            }

            this.highlightOverlay = new Alignable({// Init the highlighting overlay
                zIndex: 30,
                render: true,
                visible: false
            });
            this.overlayMask = new Y.Node.create("<div></div>");
            this.highlightOverlay.plug(Y.Plugin.WidgetMenu, {
                event: "click"
            });
            this.overlayMask.setStyles({
                zIndex: 49,
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0
            });
            this.get("host").get(BOUNDINGBOX).prepend(this.highlightOverlay.get(BOUNDINGBOX));
            host.get(CONTENTBOX).plug(Y.Plugin.ScrollInfo);
            this.doBefore("pageIdChange", function() {
                this.designButton.set("pressed", false);
            });
        },
        bind: function() {
            this.handlers.push(this.highlightOverlay.menu.on("menuOpen", function(e) {
                if (!this.highlightOverlay.get("visible")) {
                    this.highlightOverlay.menu.menu.hide();
                    return;
                }
                this.highlightOverlay.menu.menu.set("xy", [e.domEvent.clientX, e.domEvent.clientY]);
                this.targetWidget = this.overlayWidget;
                this.highlightOverlay.menu.set("children", this.targetWidget.getMenuCfg({
                    widget: this.targetWidget
                }));
            }, this));

            this.handlers.push(this.overlayMask.on("mousemove", function(e) {
                var widget;
                e.halt(true);
                this.overlayMask.hide();
                this.highlightOverlay.hide();
                widget = Y.Widget.getByNode(                                    //Find a parent Wegas widget or self
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
            this.handlers.push(this.overlayMask.on("click", function(e) {
                e.halt(true);
                this.highlightOverlay.get(CONTENTBOX).simulate("click", e);
            }, this));
            this.get("host").get(CONTENTBOX).after("mouseout", function() {
                this.hideOverlay();
            }, this);
            this.get("host").get(CONTENTBOX).scrollInfo.on("*:scroll", function(e) {
                this.overlayMask.setStyles({top: e.scrollTop, left: e.scrollLeft});
            }, this);
        },
        processSave: function() {
            var host = this.get("host"),
                    page = Y.JSON.parse(this.jsonView.getValue());
            this.sourceButton.set("pressed", false);
            host.get("contentBox").show();
            this.jsonView.hide();
            this.designButton.enable();
            this.saveButton.hide();
            //host.get("widget").set("@pageId", host.get("widget")["@pageId"]);
            page["@pageId"] = host.get("widget")["@pageId"];
            Y.Wegas.Facade.Page.cache.patch(page);
        },
        processSource: function() {
            var host = this.get("host");

            if (this.sourceButton.get("pressed")) {
                if (!this.jsonView) {
                    this.initJsonView();
                    return;
                }
                this.jsonView.setValue(Y.JSON.stringify(host.get("widget").toObject("@pageId"), null, "\t"));
                host.get("contentBox").hide();
                this.jsonView.show();
                this.jsonView.editor.resize();
                this.jsonView.focus();
                this.designButton.disable();
                this.saveButton.show();
            } else {
                host.get("contentBox").show();
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
                        parentEl: this.get("host").get("boundingBox"),
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
            for (i = 0; i < this.handlers.length; i = i + 1) {
                this.handlers[i].detach();
            }
        },
        showOverlay: function(widget) {
            var targetNode = widget.get(BOUNDINGBOX);
            if (!widget.toObject || this.overlayWidget === widget) {
                return;
            }

            this.overlayWidget = widget;

            //targetNode.prepend(this.highlightOverlay.get(BOUNDINGBOX));
            this.highlightOverlay.get(CONTENTBOX).setContent("<div>" + widget.getName() + "</div>");
            this.highlightOverlay.align(targetNode, [Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.TL]);
            try {
                this.highlightOverlay.get(BOUNDINGBOX).setStyles({
                    width: widget.get(BOUNDINGBOX).getDOMNode().offsetWidth,
                    height: widget.get(BOUNDINGBOX).getDOMNode().offsetHeight
                });
            } catch (e) {
            } finally {
                this.highlightOverlay.show();
            }
        },
        hideOverlay: function() {
            this.overlayWidget = null;
            this.highlightOverlay.hide();
        }

    }, {
        NS: "pageeditor",
        NAME: "pageeditor",
        ATTRS: {}
    });
    Y.namespace('Plugin').PageEditor = PageEditor;

});
