/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview PageEditor Extension
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-pageeditor-dragdrop", function(Y) {
    "use strict";
    /**
     * PageEditor Plugin Extension enabling position drag and drop.
     */
    function PageEditorDD() {
        Y.onceAfter(this._initDD, this, "render");
        Y.after(this._alignDD, this, "showOverlay");
    }
    PageEditorDD.NAME = "wegas-pageeditor-dragdrop";
    PageEditorDD.prototype = {
        _initDD: function() {
            if (!this.highlightOverlay) {
                Y.error("PageEditorDD is an extension for PageEditor.");
            }
            this._ddNode = Y.Node.create("<div class='pageeditor-dragnode'></div>");
            this._ddNode.setStyles({
                top: 0,
                left: 0
            });
            this.overlayMask.append(this._ddNode);
            this._ddNode.hide();
            this.highlightOverlay.after("visibleChange", function(e) {
                if (e.newVal) {
                    this._ddNode.show();
                } else {
                    this._ddNode.hide();
                }
            }, this);
            this._ddNode.before("mousedown", function(e) {
                this.detach();
                this._ddNode.show();
            }, this);
            this._dd = new Y.DD.Drag({
                node: this._ddNode
            });
            this._dd.on("drag:start", function(e) {
                try {
                    this._dd.set("dragNode", this.overlayWidget.get("boundingBox"));
                    this.overlayWidget.unplug(Y.Plugin.CSSPosition);
                    this._dd.get("dragNode").setStyles({
                        bottom: null,
                        right: null
                    });
                } catch (e) {
                }
            }, this);
            this._dd.on("drag:end", function(e) {
                var bb = this._dd.get("dragNode"), widget = Y.Widget.getByNode(bb);
                widget.plug(Y.Plugin.CSSPosition);
                widget.CSSPosition.setAttrs({
                    "styles": {
                        "position": bb.getStyle("position"),
                        "top": bb.getStyle("top"),
                        "left": bb.getStyle("left")
                    }
                });

                this.bind();
            }, this);
        },
        _alignDD: function() {
            var bb = this.overlayWidget.get("boundingBox");
            this._ddNode.setXY(bb.getXY());
        }


    };

    Y.namespace("Wegas").PageEditorDD = PageEditorDD;
});