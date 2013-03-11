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
            var el, host = this.get('host'), processSource, processSave;

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
                            } else {
                                this.detach();
                                this.highlightOverlay.hide();
                            }
                        }, this)
                    }
                }).render(el);
                /** Source view**/
                this.jsonView = new Y.inputEx.AceField({
                    parentEl: this.get("host").get("boundingBox")._node,
                    name: 'text',
                    type: 'ace',
                    height: "100%",
                    language: "json",
                    value: ''
                });
                this.jsonView.hide();
                processSource = function() {
                    if (this.sourceButton.get("pressed")) {
                        this.jsonView.setValue(Y.JSON.stringify(host.get("widget").toObject("@pageId"), null, "\t"));
                        this.get("host").get("contentBox").hide();
                        this.jsonView.show();
                        this.jsonView.editor.resize();
                        this.jsonView.focus();
                        this.designButton.disable();
                        this.saveButton.show();
                    } else {
                        this.get("host").get("contentBox").show();
                        this.jsonView.hide();
                        this.designButton.enable();
                        this.saveButton.hide();
                    }
                };
                this.sourceButton = new Y.ToggleButton({
                    label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>Source",
                    on: {
                        click: Y.bind(processSource, this)
                    }
                }).render(el);
                this.afterHostEvent("widgetChange", processSource);

                processSave = function() {
                    var page = Y.JSON.parse(this.jsonView.getValue());
                    this.sourceButton.set("pressed", false);
                    this.get("host").get("contentBox").show();
                    this.jsonView.hide();
                    this.designButton.enable();
                    this.saveButton.hide();
                    //host.get("widget").set("@pageId", host.get("widget")["@pageId"]);
                    page["@pageId"] = host.get("widget")["@pageId"];
                    Y.Wegas.PageFacade.rest.patch(page);
                };
                this.saveButton = new Y.Button({
                    label: "<span class=\"wegas-icon wegas-icon-save\"></span>Save",
                    on: {
                        click: Y.bind(processSave, this)
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
                        /*selector: ".wegas-icon"*/
            });
        },
        bind: function() {
            var cb = this.get('host').get(CONTENTBOX);

            this.highlightOverlay.menu.on("menuOpen", function(e) {
                this.highlightOverlay.menu.menu.set("xy", [e.domEvent.clientX, e.domEvent.clientY]);
                this.targetWidget = this.overlayWidget;
                this.genMenu(this.targetWidget);
            }, this);

            this.handlers.push(cb.delegate("mousemove", function(e) {
                var widget;
                e.halt();
                this.highlightOverlay.hide();
                widget = Y.Widget.getByNode(window.document.elementFromPoint(e.clientX, e.clientY));
                this.highlightOverlay.show();
                if (this.overlayWidget !== widget) {
                    this.showOverlay(widget);
                }
            }, '.wegas-widget', this));

            this.handlers.push(cb.delegate("mouseleave", function(e) {
                e.halt();
                this.hideOverlay();
            }, '.wegas-widget', this));
        },
        
        genMenu: function(widget) {
            this.highlightOverlay.menu.set("children", widget.getMenuCfg({
                widget: widget
            }));
//            if (widget.isAugmentedBy(Y.WidgetParent)) {
//                menuCfg.splice(1, 0, {type: "Button", label: "I may have children!"});
//            }
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

            targetNode.prepend(this.highlightOverlay.get(BOUNDINGBOX));
            this.highlightOverlay.get(CONTENTBOX).setContent("<div>" + widget.getName() + "</div>");
            this.highlightOverlay.align(targetNode, [Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.TL]);
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

    Y.Node.prototype.getWidth = function() {
        return parseInt(this.getComputedStyle('width'));
        //        + parseInt(this.getComputedStyle('margin-left')) + parseInt(this.getComputedStyle('margin-right'))
        //  + parseInt(this.getComputedStyle('padding-left')) + parseInt(this.getComputedStyle('padding-right'));
    };
    Y.Node.prototype.getHeight = function() {
        return parseInt(this.getComputedStyle('height'));
        //      + parseInt(this.getComputedStyle('margin-top')) + parseInt(this.getComputedStyle('margin-bottom'))
        //  + parseInt(this.getComputedStyle('padding-top')) + parseInt(this.getComputedStyle('padding-bottom'));
    };
});


