/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview PageEditor drag and drop Extension
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-pageeditor-dragdrop", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox",
        BOUNDINGBOX = "boundingBox";
    /**
     * PageEditor Plugin Extension enabling position drag and drop.
     * @constructor
     */
    function PageEditorDD() {
        Y.onceAfter(this._initDD, this, "render");
        Y.after(this._alignDD, this, "showOverlay");
        Y.onceAfter(this._destruct, this, "destructor");
    }
    PageEditorDD.NAME = "wegas-pageeditor-dragdrop";
    PageEditorDD.prototype = {
        /* @lends Y.Wegas.PageEditorDD# */
        /**
         * @private
         * @returns {undefined}
         */
        _initDD: function() {
            if (!this.highlightOverlay) {
                Y.error("PageEditorDD is an extension for PageEditor.");
            }
            this._ddNode = Y.Node.create("<div class='pageeditor-dragnode'></div>");
            this._ddNode.setStyles({
                top: 0,
                left: 0
            });
            this.highlightOverlay.get(CONTENTBOX).append(this._ddNode);
            this._ddNode.hide();
            this.highlightOverlay.after("visibleChange", function(e) {
                if (e.newVal && this.overlayWidget && this.overlayWidget.CSSPosition) {
                    this._ddNode.show();
                } else {
                    this._ddNode.hide();
                }
            }, this);
            this._dd = new Y.DD.Drag({
                node: this._ddNode
            });
            this._dd.plug(Y.Plugin.DDConstrained, {
                constrain: this.get("host").get(CONTENTBOX),
                cacheRegion: false                                              //scroll changes region
            }).plug(Y.Plugin.DDNodeScroll, {
                node: this.get("host").get(CONTENTBOX)
            });
            this._ddNode.before("mousedown", function(e) {
                var unsaved = Y.Plugin.EditEntityAction.isUnsaved();
                Y.Plugin.EditEntityAction.allowDiscardingEdits(
                    Y.bind(function () {
                        this.detachHandlers();
                        this._dd.set("dragNode", this.overlayWidget.get(BOUNDINGBOX));
                        this._dd.con.set("constrain", this.get("host").get("widget").get(CONTENTBOX));
                        this._ddNode.show();
                        if (unsaved) {
                            // Reload the form to discard any edits:
                            this._syncWidgetEdition();
                        }
                    }, this));
            }, this);
            this._ddNode.after("mouseup", function(e) {
                this.bind();
            }, this);
            this._dd.before("drag:start", function(e) {
                if (Y.Plugin.EditEntityAction.isUnsaved()) {
                    e.halt(true);
                    return false;
                }
                var node = this._dd.get("dragNode");
                node.setXY(node.getXY()); //Init left, top in case they are missing
                this._dd._initPos = {
                    left: parseInt(node.getComputedStyle("left"), 10),
                    right: parseInt(node.getComputedStyle("right"), 10),
                    top: parseInt(node.getComputedStyle("top"), 10),
                    bottom: parseInt(node.getComputedStyle("bottom"), 10)
                };
                this._dd.get("dragNode").setStyles({
                    bottom: null,
                    right: null,
                    width: node.getComputedStyle("width"),
                    height: node.getComputedStyle("height")
                });
                this.fixedOverlay(Y.Widget.getByNode(node));
            }, this);
            this._dd.after("drag:drag", function() {
                this.fixedOverlay(this.shownOverlay._widget);
            }, this);
            this._dd.on("drag:end", function(e) {
                if (Y.Plugin.EditEntityAction.isUnsaved()) {
                    e.halt(true);
                    return false;
                }
                var bb = this._dd.get("dragNode"),
                    widget = Y.Widget.getByNode(bb),
                    oldStyles = widget.CSSPosition.get("styles"),
                    newStyles = {},
                    style;
                for (style in oldStyles) {
                    if (oldStyles.hasOwnProperty(style)) {
                        if (oldStyles[style] !== "") {
                            switch (style) {
                                case "right":
                                    newStyles[style] = this._dd._initPos[style] + this._dd._initPos.left - parseInt(bb.getStyle("left"), 10) + "px";
                                    break;
                                case "bottom":
                                    newStyles[style] = this._dd._initPos[style] + this._dd._initPos.top - parseInt(bb.getStyle("top"), 10) + "px";
                                    break;
                                default:
                                    newStyles[style] = bb.getComputedStyle(style);
                            }
                        } else {
                            /*
                             * if no properties are defined horizontally or vertically
                             * specify respectively "left" or "top
                             */
                            switch (style) {
                                case "left":
                                    if (oldStyles.right === "") {
                                        newStyles[style] = bb.getComputedStyle(style);
                                    }
                                    break;
                                case "top":
                                    if (oldStyles.bottom === "") {
                                        newStyles[style] = bb.getComputedStyle(style);
                                    }
                                    break;
                                default:
                                    newStyles[style] = "";
                            }

                        }
                    }
                }
                widget.CSSPosition.set("styles", newStyles);
                /*
                 * Remove Size and set them through CSSSize if it exists
                 */
                bb.setStyles({
                    width: null,
                    height: null
                });
                if (widget.CSSSize) {
                    widget.CSSSize.set("styles", widget.CSSSize.get("styles"));
                }
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
        _alignDD: function() {
            var bb = this.overlayWidget.get(BOUNDINGBOX);
            if (bb.getDOMNode()) {
                this._ddNode.setXY(bb.getXY());
                this._ddNode.setStyle("width", bb.getDOMNode().offsetWidth);
                this._ddNode.setStyle("height", bb.getDOMNode().offsetHeight);
            }

        },
        /**
         * self destructor called after PageEditor's destructor
         * @private
         * @returns {undefined}
         */
        _destruct: function() {
            Y.detach(this._alignDD, this, "showOverlay");
            this._dd.detachAll();
            this._ddNode.detachAll();
            this._dd.destroy();
            this._ddNode.destroy(true);
        }

    };
    Y.Wegas.PageEditorDD = PageEditorDD;
});
