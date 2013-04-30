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
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span><span class='experimental'>Edit page</span>",
                    on: {
                        click: Y.bind(function(e) {
                            this.get("host").get(BOUNDINGBOX).toggleClass("wegas-pageeditor-designmode",
                                    e.target.get("pressed"));
                            if (e.target.get("pressed")) {
                                this.bind();
                                this.layoutbutton.show();
                            } else {
                                this.detach();
                                this.highlightOverlay.hide();
                                if (this.layoutbutton.get("pressed")) {
                                    this.layoutbutton.toggle();
                                    this.get("host").get(BOUNDINGBOX).removeClass("wegas-pageeditor-layoutmode");
                                }
                                this.layoutbutton.hide();
                            }
                        }, this)
                    }
                }).render(el);
                this.layoutbutton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span>Show regions</span>",
                    on: {
                        click: Y.bind(function(e) {
                            this.get("host").get(BOUNDINGBOX).toggleClass("wegas-pageeditor-layoutmode",
                                    e.target.get("pressed"));
                        }, this)
                    },
                    visible: false
                }).render(el);

                /** Source view**/

                this.sourceButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>Source",
                    on: {
                        click: Y.bind(this.processSource, this)
                    }
                }).render(el);
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
            this.highlightOverlay.plug(Y.Plugin.WidgetMenu, {
                event: "click"
            });
            this.get("host").get(BOUNDINGBOX).prepend(this.highlightOverlay.get(BOUNDINGBOX));
        },
        bind: function() {
            var cb = this.get('host').get(CONTENTBOX);

            this.handlers.push(this.highlightOverlay.menu.on("menuOpen", function(e) {
                this.highlightOverlay.menu.menu.set("xy", [e.domEvent.clientX, e.domEvent.clientY]);
                this.targetWidget = this.overlayWidget;
                this.highlightOverlay.menu.set("children", this.targetWidget.getMenuCfg({
                    widget: this.targetWidget
                }));
            }, this));
            this.handlers.push(this.get("host").get(BOUNDINGBOX).delegate("mousestart", function(e) {
                e.halt(true);
                this.highlightOverlay.hide();
            }, '.wegas-widget', this));
            this.handlers.push(this.get("host").get(BOUNDINGBOX).delegate("mousestop", function(e) {
                var widget = Y.Widget.getByNode(window.document.elementFromPoint(e.clientX, e.clientY));
                e.halt(true);
                if (widget === this.get("host")) {
                    this.highlightOverlay.hide();
                    return;
                }
                if (this.overlayWidget !== widget) {
                    this.showOverlay(widget);
                } else {
                    this.highlightOverlay.show();
                }
            }, '.wegas-widget', this));
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
            this.highlightOverlay.get(BOUNDINGBOX).setStyles({
                width: widget.get(BOUNDINGBOX).getDOMNode().offsetWidth,
                height: widget.get(BOUNDINGBOX).getDOMNode().offsetHeight
            });
            this.highlightOverlay.show();
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
