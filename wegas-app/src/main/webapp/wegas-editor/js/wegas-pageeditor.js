/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-pageeditor', function(Y) {
    "use strict";

    /**
     *  @class WidgetMenu
     *  @module Wegas
     *  @constructor
     */
    var BOUNDINGBOX = "boundingBox",
            CONTENTBOX = "contentBox",
            Alignable = Y.Base.create("wegas-pageeditor-overlay", Y.Widget, [Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack], {
        //CONTENT_TEMPLATE: '<div><span class="wegas-icon wegas-icon-edit"></span><div>'
    }, {
        CSS_PREFIX: "wegas-pageeditor-overlay"
    }),
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
                    label: "<span class=\"wegas-icon wegas-icon-designmode\"></span>Edit page",
                    on: {
                        click: Y.bind(function(e) {
                            this.get("host").get(BOUNDINGBOX).toggleClass("wegas-pageeditor-designmode", e.target.get("pressed"));
                            if (e.target.get("pressed")) {
                                this.bind();
                            } else {
                                this.detach();
                                this.highlightOverlay.hide();
                            }
                        }, this)
                    }
                }).render(el);
            }

            this.highlightOverlay = new Alignable({// Init the highlighting overlay
                zIndex: 23,
                render: true,
                visible: false
            });

            this.highlightOverlay.plug(Y.Plugin.WidgetMenu, {
                children: [{
                        type: "Button",
                        label: "Edit",
                        on: {
                            click: Y.bind(function() {                             // Display the edit form
                                Y.Plugin.EditEntityAction.showEditForm(this.targetWidget, Y.bind(function(targetWidget, val, e, f) {
                                    Y.Plugin.EditEntityAction.hideEditFormOverlay();
                                    targetWidget.setAttrs(val);
                                    targetWidget.syncUI();
                                    Y.Wegas.PageFacade.rest.patch(targetWidget.get("root").toObject());
                                }, this, this.targetWidget));
                            }, this)
                        }
                    }, {
                        type: "Button",
                        label: "Delete",
                        on: {
                            click: Y.bind(function() {
                                this.targetWidget.destroy();
                            }, this)
                        }
                    }],
                event: "click"
                        /*selector: ".wegas-icon"*/
            });

            this.highlightOverlay.menu.on("menuOpen", function() {
                this.targetWidget = this.overlayWidget;
            }, this);
        },
        bind: function() {
            var cb = this.get('host').get(CONTENTBOX);

            //            this.handlers.push(cb.delegate("mouseup", function(e) {
            //            }, '.wegas-widget', this));

            this.handlers.push(cb.on("click", function(e) {
                this.targetWidget = this.overlayWidget;
                this.highlightOverlay.menu.show();
                this.highlightOverlay.menu.menu.set("xy", [e.clientX, e.clientY]);
                this.showOverlay(this.overlayWidget);
                e.halt(true);
            }, this));

            this.handlers.push(cb.delegate("mouseover", function(e) {
                e.halt();
                var widget = Y.Widget.getByNode(e.currentTarget);
                if (widget) {
                    this.showOverlay(widget);
                }
            }, '.wegas-widget', this));

            /*this.handlers.push(cb.delegate("mouseleave", function(e) {
             //console.log("out", e.currentTarget.get('id'));
             this.hideOverlay();
             e.halt();

             var parentWidget = Y.Widget.getByNode(e.currentTarget.get('parentNode'));
             if (parentWidget && parentWidget.get('root') !== parentWidget) {
             this.showOverlay(parentWidget);
             }
             }, '.yui3-widget', this));*/
        },
        detach: function() {
            var i;
            for (i = 0; i < this.handlers.length; i = i + 1) {
                this.handlers[i].detach();
            }
        },
        showOverlay: function(widget) {
            var targetNode = widget.get(BOUNDINGBOX),
                    fullHeight = parseInt(targetNode.getComputedStyle("height")) +
                    parseInt(targetNode.getComputedStyle("padding-top")) +
                    parseInt(targetNode.getComputedStyle("padding-bottom")) +
                    parseInt(targetNode.getComputedStyle("margin-bottom")) +
                    parseInt(targetNode.getComputedStyle("margin-top")),
                    fullWidth = parseInt(targetNode.getComputedStyle("width")) +
                    parseInt(targetNode.getComputedStyle("padding-left")) +
                    parseInt(targetNode.getComputedStyle("padding-right")) +
                    parseInt(targetNode.getComputedStyle("margin-left")) +
                    parseInt(targetNode.getComputedStyle("margin-right"));

            if (!widget.toObject || this.overlayWidget === widget) {
                return;
            }

            this.overlayWidget = widget;

            targetNode.prepend(this.highlightOverlay.get(BOUNDINGBOX));
            this.highlightOverlay.get(CONTENTBOX).setStyle("height", fullHeight);
            this.highlightOverlay.get(CONTENTBOX).setStyle("width", fullWidth);
            this.highlightOverlay.get(CONTENTBOX).setContent("<span>" + widget.constructor.NAME + "</span>");
            this.highlightOverlay.align(targetNode, ["tl", "tl"]);
            this.highlightOverlay.show();
        },
        hideOverlay: function() {
            this.highlightOverlay.hide();
        }

    }, {
        NS: "pageeditor",
        NAME: "pageeditor",
        ATTRS: {}
    });
    Y.namespace('Plugin').PageEditor = PageEditor;

    Y.Node.prototype.getWidth = function() {
        return parseInt(this.getComputedStyle('width'))
        //        + parseInt(this.getComputedStyle('margin-left')) + parseInt(this.getComputedStyle('margin-right'))
        //  + parseInt(this.getComputedStyle('padding-left')) + parseInt(this.getComputedStyle('padding-right'));
    };
    Y.Node.prototype.getHeight = function() {
        return parseInt(this.getComputedStyle('height'))
        //      + parseInt(this.getComputedStyle('margin-top')) + parseInt(this.getComputedStyle('margin-bottom'))
        //  + parseInt(this.getComputedStyle('padding-top')) + parseInt(this.getComputedStyle('padding-bottom'));
    };
});


