/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview PageEditor resize Extension
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-pageeditor-resize", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox",
        BOUNDINGBOX = "boundingBox",
        WIDTH = "width",
        HEIGHT = "height";
    /**
     * PageEditor Plugin Extension enabling widget resize.
     * @constructor
     */
    function PageEditorResize() {
        Y.onceAfter(this._initResize, this, "render");
        Y.after(this._alignResize, this, "showOverlay");
        Y.once(this._resizeDestruct, this, "destructor");
        Y.after(this._setupIcon, this, "fixedOverlay");
    }
    PageEditorResize.NAME = "wegas-pageeditor-resize";
    PageEditorResize.prototype = {
        /* @lends Y.Wegas.PageEditorResize# */
        /**
         * @private
         * @returns {undefined}
         */
        _initResize: function() {
            if (!this.highlightOverlay) {
                Y.error("PageEditorResize is an extension for PageEditor.");
            }
            this._resizeNode = Y.Node.create("<div class='pageeditor-resizenode'></div>");
            this._iconResizeNode = Y.Node.create("<div class='pageeditor-resizenode-icon'></div>");
            this._resizeNode.setStyles({
                top: 0,
                left: 0
            });
            this.highlightOverlay.get(CONTENTBOX).append(this._resizeNode);
            this._resizeNode.hide();
            this.shownOverlay.get(CONTENTBOX).append(this._iconResizeNode);
            this.highlightOverlay.after("visibleChange", function(e) {
                if (e.newVal && this.overlayWidget && this.overlayWidget.CSSSize) {
                    this._resizeNode.show();
                } else {
                    this._resizeNode.hide();
                }
            }, this);
            this._resize = new Y.DD.Drag({
                node: this._resizeNode
            });
            this._resize.plug(Y.Plugin.DDNodeScroll, {
                node: this.get("host").get(CONTENTBOX)
            });
            //    .plug(Y.Plugin.DDConstrained, {
            //    constrain: this.get("host").get(CONTENTBOX),
            //    cacheRegion: false                                              //scroll changes region
            //});
            this._resizeNode.before("mousedown", function(e) {
                    var unsaved = Y.Plugin.EditEntityAction.isUnsaved();
                    Y.Plugin.EditEntityAction.allowDiscardingEdits(
                        Y.bind(function () {
                            this.detachHandlers();
                            this._resizeNode.show();
                            this._dd.con.set("constrain", this.get("host").get("widget").get(CONTENTBOX));
                            this._resize._widget = this.shownOverlay._widget.get(BOUNDINGBOX);
                            if (unsaved) {
                                // Reload the form to discard any edits:
                                this._syncWidgetEdition(this.shownOverlay._widget);
                            }
                        }, this));
            }, this);
            this._resizeNode.after("mouseup", function(e) {
                this.bind();
            }, this);
            this._resize.on("drag:drag", function(e) {
                if (Y.Plugin.EditEntityAction.isUnsaved()) {
                    e.halt(true);
                    return false;
                }
                var bb = this._resize._widget;
                bb.setStyles({
                    width: parseInt(bb.getComputedStyle(WIDTH), 10) + e.info.delta[0],
                    height: parseInt(bb.getComputedStyle(HEIGHT), 10) + e.info.delta[1]
                });
                this.fixedOverlay(this.shownOverlay._widget);
            }, this);
            //var bindedFixedOverlay = Y.bind(this.fixedOverlay, this);
//            this._resize.before("drag:start", function(e) {
//                var bb = this._widget;
//                bb.setStyles({
//                    width: bb.getComputedStyle(WIDTH),
//                    height: bb.getComputedStyle(HEIGHT)
//                });
//                bindedFixedOverlay(Y.Widget.getByNode(bb));
//            });
            this._resize.on("drag:end", function(e) {
                if (Y.Plugin.EditEntityAction.isUnsaved()) {
                    e.halt(true);
                    return false;
                }
                var widget = this.shownOverlay._widget, bb = widget.get(BOUNDINGBOX);
                widget.CSSSize.setAttrs({
                    styles: {
                        width: bb.getComputedStyle(WIDTH),
                        height: bb.getComputedStyle(HEIGHT)
                    }
                });
                this._resize._widget = null;
                this.fixedOverlay(widget);
                this.saveCurrentPage();
                this.bind();
                this._syncWidgetEdition();
            }, this);
        },
        /**
         * Align drag node with PageEditor's overlay
         * @private
         * @returns {undefined}
         */
        _alignResize: function() {
            var bb = this.shownOverlay.get(BOUNDINGBOX), pos = bb.getXY();
            if (pos) {  //widget not destroyed
                pos[0] = pos[0] + bb.getDOMNode().offsetWidth - 12;
                pos[1] = pos[1] + bb.getDOMNode().offsetHeight - 12;
                this._resizeNode.setXY(pos);
            }
        },
        _setupIcon: function() {
            if (this.shownOverlay._widget && this.shownOverlay._widget.CSSSize) {
                this._iconResizeNode.show();
            } else {
                this._iconResizeNode.hide();
            }
        },
        /**
         * self destructor called after PageEditor's destructor
         * @private
         * @returns {undefined}
         */
        _resizeDestruct: function() {
            Y.detach(this._alignResize, this, "showOverlay");
            Y.detach(this._setupIcon, this, "fixedOverlay");
            this._resize.detachAll();
            this._resizeNode.detachAll();
            this._resize.destroy();
            this._resizeNode.destroy(true);
            this._iconResizeNode.destroy(true);
        }

    };
    Y.Wegas.PageEditorResize = PageEditorResize;
});
