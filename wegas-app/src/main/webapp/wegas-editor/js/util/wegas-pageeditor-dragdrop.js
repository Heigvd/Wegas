/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
            this.overlayMask.append(this._ddNode);
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
                this.detach();
                this._dd.set("dragNode", this.overlayWidget.get(BOUNDINGBOX));
                this._dd.con.set("constrain", this.get("host").get("widget").get(CONTENTBOX));
                this._ddNode.show();
            }, this);
            this._ddNode.after("mouseup", function(e) {
                this.bind();
            }, this);
            this._dd.before("drag:start", function(e) {
                var node = this._dd.get("dragNode");
                node.setXY(node.getXY());                                       //Init left, top in case they are missing
                this._dd._initPos = {
                    left: parseInt(node.getComputedStyle("left")),
                    right: parseInt(node.getComputedStyle("right")),
                    top: parseInt(node.getComputedStyle("top")),
                    bottom: parseInt(node.getComputedStyle("bottom"))
                };
                this._dd.get("dragNode").setStyles({
                    bottom: null,
                    right: null,
                    width: node.getComputedStyle("width"),                      //@todo: those needs to be removed
                    height: node.getComputedStyle("height")
                });
            }, this);
            this._dd.on("drag:end", function(e) {
                //@todo : if no props are defined ? left and right missing ?
                var bb = this._dd.get("dragNode"),
                        widget = Y.Widget.getByNode(bb),
                        oldStyles = widget.CSSPosition.get("styles"),
                        newStyles = {};
                for (var s in oldStyles) {
                    if (oldStyles[s] !== "") {
                        switch (s) {
                            case "right":
                                newStyles[s] = this._dd._initPos[s] + this._dd._initPos["left"] - parseInt(bb.getStyle("left")) + "px";
                                break;
                            case "bottom":
                                newStyles[s] = this._dd._initPos[s] + this._dd._initPos["top"] - parseInt(bb.getStyle("top")) + "px";
                                break;
                            default:
                                newStyles[s] = bb.getComputedStyle(s);
                        }
                    } else {
                        newStyles[s] = "";
                    }
                }
                widget.CSSPosition.set("styles", newStyles);
                this.showOverlay(widget, true);
                this.saveCurrentPage();
                this.bind();
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

    Y.namespace("Wegas").PageEditorDD = PageEditorDD;
});