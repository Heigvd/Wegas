/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
    var ResizableLayout = Y.Base.create("wegas-layout-resizable", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild], {
        CONTENT_TEMPLATE: '<div>'
                + '<div class="wegas-layout-hd"></div>'
                + '<div class="wegas-layout-bd"><div>'
                + '<div class="wegas-layout-left"></div>'
                + '<div class="wegas-layout-center"></div>'
                + '<div class="wegas-layout-right"></div>'
                + '</div></div>'
                + '<div class="wegas-layout-ft"></div>'
                + '</div>',
        /** @lends Y.Wegas.ResizableLayout# */

        // *** Private fields *** //
        /**
         * Reference to Y.Resize left object of the panel
         */
        resizeLeft: null,
        /**
         * Reference to Y.Resize right object of the panel
         */
        resizeRight: null,
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         */
        initializer: function() {
            this.handlers = [];
            this.anims = {};
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
            Y.on("windowresize", Y.bind(this.syncUI, this));                    // Sync the layout whenever the windows is resized
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
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
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
        getPositionNode: function(position) {
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
            var node = this.getPositionNode(position);
            if (!!this.get(position + ".animate")) {                            // False by default
                node.setStyle("left", "initial");                               // Reset left value
                this.oldWidth = node.getStyle("width");
                node.setStyle("width", "0");
                this.syncCenterNode();
                //this.getAnim(position).setAttrs({// and change anim width because the element may have been resized
                //    reverse: true,
                //    to: {
                //        width: node.getStyle("width")
                //    }
                //}).run();
            } else {
                node.all(".yui3-tabview-panel > div").hide();// @hack
            }
        },
        /**
         * @function
         * @private
         * @param position
         * @description do a slide (tween) animation to show the panel
         */
        showPosition: function(position) {
            var target = this.getPositionNode(position);

            if (!!this.get(position + ".animate")) {                            // False by default
                //if (parseInt(target.getStyle("width"), 10) < cfg.width) {     // Only display if hidde
                if (parseInt(target.getStyle("width"), 10) < 70) {              // Only display if hidde
                    target.setStyle("left", "initial");                         // Reset left value since it may have been changed during resize
                    target.setStyle("width", this.oldWidth || ((this.get(position + ".width") || 430) + "px"));
                    this.syncCenterNode();
                    //this.getAnim(position).set("reverse", false).run();
                }
            } else {
                target.all(".yui3-tabview-panel > div").show();
            }
        },
        getAnim: function(position) {
            if (!this.anims[position]) {
                var anim = new Y.Anim({
                    node: this.getPositionNode(position),
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
                    target = this.getPositionNode(position),
                    cfg = this.get(position);

            if (cfg) {                                                  // If there is a provided configuration
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
                        width: cfg.width || 0
                    });
                }

                for (i = 0; i < cfg.children.length; i = i + 1) {      // ender the children
                    cWidget = Y.Wegas.Widget.create(cfg.children[i]);
                    // cWidget.after("render", this.syncUI, this );
                    cWidget.render(target);
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
            var cb = this.get("contentBox"),
                    leftNode = cb.one(".wegas-layout-left"),
                    rightNode = cb.one(".wegas-layout-right");

            cb.one(".wegas-layout-center").setStyles({
                left: leftNode.getStyle("width"),
                right: rightNode.getStyle("width")
            });
            Y.Wegas.app.fire("layout:resize");
        }
    }, {
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

    Y.namespace('Wegas').ResizableLayout = ResizableLayout;
});