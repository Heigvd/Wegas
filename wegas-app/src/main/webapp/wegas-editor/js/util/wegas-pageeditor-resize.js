/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview PageEditor resize Extension
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-pageeditor-resize", function(Y) {
    "use strict";
    /**
     * PageEditor Plugin Extension enabling widget resize.
     * @constructor
     */
    function PageEditorResize() {
        Y.onceAfter(this._initResize, this, "render");
        Y.after(this._alignResize, this, "showOverlay");
        Y.onceAfter(this._resizeDestruct, this, "destructor");
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
                Y.error("PageEditorDD is an extension for PageEditor.");
            }
            this._resizeNode = Y.Node.create("<div class='pageeditor-resizenode'></div>");
            this._resizeNode.setStyles({
                top: 0,
                left: 0
            });
            this.overlayMask.append(this._resizeNode);
            this._resizeNode.hide();
            this.highlightOverlay.after("visibleChange", function(e) {
                if (e.newVal) {
                    this._resizeNode.show();
                } else {
                    this._resizeNode.hide();
                }
            }, this);

            this._resize = new Y.DD.Drag({
                node: this._resizeNode
            });
            this._resize.plug(Y.Plugin.DDConstrained, {
                constrain: this.get("host").get("contentBox")
            }).plug(Y.Plugin.DDNodeScroll, {
                node: this.get("host").get("contentBox")
            });
            this._resizeNode.before("mousedown", function(e) {
                this.detach();
                this._resizeNode.show();
                try {
                    this._resize._widget = this.overlayWidget.get("boundingBox");
                } catch (ex) {
                }
            }, this);
            this._resizeNode.after("mouseup", function(e) {
                this.bind();
            }, this);
            this._resize.on("drag:drag", function(e) {
                var bb = this._widget;
                bb.setStyles({
                    width: parseInt(bb.getComputedStyle("width")) + e.info.delta[0],
                    height: parseInt(bb.getComputedStyle("height")) + e.info.delta[1]
                });
            });
            this._resize.before("drag:start", function(e) {
                var bb = this._widget;
                bb.setStyles({
                    width: bb.getComputedStyle("width"),
                    height: bb.getComputedStyle("height")
                });
            });
            this._resize.on("drag:end", function(e) {
                var bb = this._resize._widget, widget = Y.Widget.getByNode(bb);
                widget.plug(Y.Plugin.CSSSize);                                  //no effect if present
                widget.CSSSize.setAttrs({
                    "styles": {
                        "width": bb.getComputedStyle("width"),
                        "height": bb.getComputedStyle("height")
                    }
                });
                this._resize._widget = null;
                //console.log(this.get("host").get("widget").toObject()); //save
                this.bind();
            }, this);
        },
        /**
         * Align drag node with PageEditor's overlay
         * @private
         * @returns {undefined}
         */
        _alignResize: function() {
            var bb = this.overlayWidget.get("boundingBox"), pos = bb.getXY();
            pos[0] = pos[0] + bb.getDOMNode().offsetWidth - 23;
            pos[1] = pos[1] + bb.getDOMNode().offsetHeight - 23;
            this._resizeNode.setXY(pos);
        },
        /**
         * self destructor called after PageEditor's destructor
         * @private
         * @returns {undefined}
         */
        _resizeDestruct: function() {
            Y.detach(this._alignResize, this, "showOverlay");
            this._resize.detachAll();
            this._resizeNode.detachAll();
            this._resize.destroy();
            this._resizeNode.destroy(true);
        }

    };

    Y.namespace("Wegas").PageEditorResize = PageEditorResize;
});