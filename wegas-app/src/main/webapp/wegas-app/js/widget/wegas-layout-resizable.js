/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-layout-resizable', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.ResizableLayout
     * @extends Y.Widget
     * @borrows Y.Wegas.Widget, Y.WidgetChild, Y.WidgetStdMod
     * @class class to show/hide a page with a slid effect
     * @constructor
     * @description Show/hide a page with a slid (tween) effect
     */
    var ResizableLayout = Y.Base.create("wegas-layout-resizable",
        Y.Widget,
        [Y.Wegas.Widget,
            Y.Wegas.Editable,
            Y.WidgetChild],
        {
            CONTENT_TEMPLATE: '<div>' +
                              '<div class="wegas-layout-hd"></div>' +
                              '<div class="wegas-layout-bd"><div>' +
                              '<div class="wegas-layout-left"></div>' +
                              '<div class="wegas-layout-center wegas-layout-pane"></div>' +
                              '<div class="wegas-layout-right wegas-layout-pane"></div>' +
                              '</div></div>' +
                              '<div class="wegas-layout-ft"></div>' +
                              '</div>',
            HANDLEBAR_WIDTH: 4,
            /** @lends Y.Wegas.ResizableLayout# */

            // *** Private fields *** //
            // *** Lifecycle Methods *** //
            /**
             * @function
             * @private
             * @description Set variables with initials values.
             */
            initializer: function() {
                this.oldWidth = {};
                this.handlers = [];
                this.anims = {};
                this.widgets = [];
            },
            /**
             * @function
             * @private
             * @description call function "renderPosition" for 4
             *  position (top, left, center and right).
             *  Call function "_syncUIStdMod";
             */
            renderUI: function() {
                this.renderPosition('top');
                this.renderPosition('left');
                this.renderPosition('center');
                this.renderPosition('right');
                //this.renderPosition('bottom');
            },
            /**
             * @function
             * @private
             * @description bind function to events.
             * When window is resized, do sync.
             * When dom is ready, do sync.
             */
            bindUI: function() {
                Y.on("windowresize", Y.bind(this.syncUI, this));                    // Sync the layout whenever the
                                                                                    // windows is resized
                Y.on('domready', this.syncUI, this);
            },
            /**
             * @function
             * @private
             * @description call functions "syncCenterNode" and "_syncUIStdMod";
             */
            syncUI: function() {
                this.syncCenterNode();
            },
            /**
             * @function
             * @private
             * @description Detach all functions created by this widget.
             */
            destructor: function() {
                if (this.resizeLeft) {
                    this.resizeLeft.destroy();
                }
                if (this.resizeRight) {
                    this.resizeRight.destroy();
                }
                Y.Array.each(this.widgets, function(w) {
                    w.destroy();
                });
                Y.Object.each(this.handlers, function(h) {
                    h.detach();
                });
            },
            // ** Private Methods ** //
            /**
             * @function
             * @private
             * @param position
             * @return target (node) or null
             * @description return a node corresponding to the given position (top,
             * bottom, center, right or left).
             */
            getPosition: function(position) {
                var cb = this.get("contentBox");
                switch (position) {
                    case "top" :
                        return cb.one(".wegas-layout-hd");
                    case "bottom" :
                        return cb.one(".wegas-layout-ft");
                    case "left" :
                        return cb.one(".wegas-layout-left");
                    case "center" :
                        return cb.one(".wegas-layout-center");
                    case "right" :
                        return cb.one(".wegas-layout-right");
                }
            },

            /**
             * @function
             * @private
             * @param position
             * @description do a slide (tween) animation to hide the panel
             */
            hidePosition: function(position) {
                var node = this.getPosition(position);
                //if (!!this.get(position + ".animate")) {                          // False by default
                this.oldWidth[position] = node.getComputedStyle("width");
                node.setStyle("left", "initial");                                   // Reset left value

                node.setStyle("width", "0");
                this.syncCenterNode();

                //} else {
                //  this.getAnim(position).setAttrs({// and change anim width because the element may have been resized
                //    reverse: true,
                //    to: {
                //        width: node.getStyle("width")
                //    }
                //  }).run();
                //}
            },
            /**
             * @function
             * @private
             * @param position
             * @description do a slide (tween) animation to show the panel
             */
            showPosition: function(position) {
                var target = this.getPosition(position);

                //if (!!this.get(position + ".animate")) {                          // False by default
                //if (parseInt(target.getStyle("width"), 10) < cfg.width) {         // Only display if hidde
                if (parseInt(target.getStyle("width"), 10) < 70) {                  // If is hidden
                    target.setStyle("left", "initial");                             // Reset left value since it may
                                                                                    // have been changed during resize
                    target.setStyle("width",
                        this.oldWidth[position] || ((this.get(position + ".width") || 430) + "px"));
                    this.syncCenterNode();
                }
                //} else {
                //this.getAnim(position).set("reverse", false).run();
                //}
            },
            getAnim: function(position) {
                if (!this.anims[position]) {
                    var anim = new Y.Anim({
                        node: this.getPosition(position),
                        from: {
                            width: 0
                        },
                        to: {
                            width: this.get(position + ".width") || 400
                        },
                        easing: 'easeOut',
                        duration: 0.6
                    });
                    anim.on('tween', this.syncCenterNode, this);
                    anim.on('end', this.syncCenterNode, this);
                    this.anims[position] = anim;
                }
                return this.anims[position];
            },
            /**
             * @function
             * @private
             * @param position
             * @description
             */
            renderPosition: function(position) {
                var i, cWidget,
                    target = this.getPosition(position),
                    cfg = this.get(position);

                if (cfg) {                                                          // If there is a provided configuration
                    target.setStyle("width", cfg.width);
                    if (position === "left") {
                        this.resizeLeft = new Y.Resize({
                            node: target,
                            handles: 'r'
                        });
                        this.resizeLeft.on("resize", this.syncCenterNode, this);
                        this.resizeLeft.on("end", this.syncCenterNode, this);
                        target.setStyles({
                            right: "auto",
                            left: "0px"
                        });
                    } else if (position === "right") {
                        this.resizeRight = new Y.Resize({
                            node: target,
                            handles: 'l'
                        });
                        this.resizeRight.on("resize", this.syncCenterNode, this);
                        this.resizeRight.on("end", this.syncCenterNode, this);
                        target.setStyles({
                            right: "0px",
                            left: "auto",
                            width: cfg.width || (Y.DOM.winWidth() - this.get("center.width")) + "px"
                        });
                    }

                    for (i = 0; i < cfg.children.length; i = i + 1) {               // render children
                        cWidget = Y.Wegas.Widget.create(cfg.children[i]);
                        // cWidget.after("render", this.syncUI, this );
                        cWidget.render(target);
                        this.widgets.push(cWidget);
                    }
                } else {
                    target.setStyle("width", "0");
                }
            },
            /**
             * @function
             * @private
             * @description refresh the style of the center node
             */
            syncCenterNode: function() {
                var centerNode = this.getPosition("center"),
                    rightNode = this.getPosition("right"),
                    center = centerNode.getStyle('width'),
                    left = this.getPosition("left").getComputedStyle("width");
                // If center width is set to zero, it shall remain hidden:
                if (center !== '0px') {
                    centerNode.setStyles({
                        left: left,
                        right: rightNode.getComputedStyle("width")
                    });
                    rightNode.setStyles({
                        left: 'auto'
                    });
                } else {
                    rightNode.setStyles({
                        left: parseInt(left, 10) - this.HANDLEBAR_WIDTH
                    });
                }
                Y.Wegas.app.fire("layout:resize");
            }
        },
        {
            /**
             * @lends Y.Wegas.ResizableLayout#
             */
            /**
             * @field
             * @static
             * @description
             * <p><strong>Attributes</strong></p>
             * <ul>
             *    <li>left: configuration and childrens of the left section.</li>
             *    <li>right: configuration and childrens of the right section.</li>
             *    <li>top: configuration and childrens of the top section.</li>
             *    <li>bottom: configuration and childrens of the bottom section.</li>
             *    <li>center: configuration and childrens of the center section.</li>
             *    <li>headerContent:  Reset default value to force display by default.</li>
             *    <li>footerContent: Reset default value to force display by default.</li>
             *    <li>bodyContent: Reset default value to force display by default.</li>
             *    <li>height: height of the section.</li>
             * </ul>
             */
            ATTRS: {
                left: {},
                /**
                 * Configuration and childrens of the left section.
                 */
                right: {},
                /**
                 * Configuration and childrens of the right section.
                 */
                top: {},
                /**
                 * Configuration and childrens of the top section.
                 */
                bottom: {},
                /**
                 * Configuration and childrens of the bottom section.
                 */
                center: {},
                /**
                 * Height of the section.
                 */
                height: {
                    value: "100%"
                }
            }
        });
    Y.Wegas.ResizableLayout = ResizableLayout;

    function HideCenter() {
        Y.onceAfter(this._init, this, "render");
        Y.onceAfter(this._destruct, this, "destructor");
    }

    HideCenter.NAME = "HideCenter";
    HideCenter.prototype = {
        _init: function() {
            var center = Y.Widget.getByNode(this.get("contentBox").one("#centerTabView"));
            if (center) {
                center.after(["removeChild", "addChild", "*:visibleChange"], function(e) {
                    if (center.size()) {
                        this.showCenter();
                    } else {
                        this.hideCenter();
                    }
                }, this);
            }
            //            this.getPosition("right").prepend("<span class='fa fa-link'></span>");
        },
        _destruct: function() {
            if (this.__h) {
                this.__h.detach();
            }
            if (this.__wh) {
                this.__wh.detach();
            }
        },
        hideCenter: function() {
            if (this.oldRight) {
                return;
            }
            this.hidePosition("center");
            this.oldRight = this.getPosition("right").getComputedStyle("width");
            this.getPosition("right").setStyles({
                "left": parseInt(this.getPosition("left").getStyle("width"), 10) -8,
                "width": "auto"
            });
            this.__h = this.resizeRight.after(["resize", "end"], function(e) {
                this.getPosition("left").setStyle("width", e.info.left + 8);
            }, this);
            this.__wh = Y.on("windowresize", Y.bind(function() {
                this.getPosition("right").setStyle("left", this.getPosition("left").getStyle("width"));
            }, this));
        },
        showCenter: function() {
            if (!this.oldRight) {
                return;
            }
            this._destruct();
            this.showPosition("center");
            this.getPosition("right").setStyles({
                "width": this.oldRight
            });
            delete this.oldRight;
            this.getPosition("center").setStyle("width", "auto");
            this.syncCenterNode();
        }
    };
    Y.Base.mix(ResizableLayout, [HideCenter]);
});
