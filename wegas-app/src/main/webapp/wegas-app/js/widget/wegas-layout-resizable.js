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
                              '<div class="wegas-layout-center wegas-layout-column"></div>' +
                              '<div class="wegas-layout-right wegas-layout-column"></div>' +
                              '</div></div>' +
                              '<div class="wegas-layout-ft"></div>' +
                              '</div>',
            HANDLEBAR_WIDTH: 4,
            LEFT_COL_WIDTH: "300px",
            CENTER_COL_WIDTH: "420px",
            WEGAS_EDITOR_LOCALSTORAGE_ID: "wegas-editor",

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
                var cfg = localStorage.getItem(this.WEGAS_EDITOR_LOCALSTORAGE_ID) || {};
                if (typeof cfg === "string") {
                    try {
                        cfg = JSON.parse(cfg);
                    } catch(e) {
                        cfg = {};
                    }
                }
                this.editorCfg = cfg;
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
                if (!this.initialLeft) {
                    this.initialLeft = this.initializeInitLeft();
                }
                this.lastEditorAdjustments();
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
             * Perform last adjustments before the editor is ready:
             */
            lastEditorAdjustments: function() {
                var TabView = Y.Wegas.TabView,
                    editorLabel = TabView.getEditorTabLabel(),
                    editorTab = TabView.getEditorTab();
                // Is it too early ?
                if (!editorTab) {
                    return;
                }
                var editorTabSelector = editorTab.get("tabSelector"),
                    preferredEditorTabView = TabView.getDefaultEditorTabView();
                // Make sure the Attributes tab is on the correct side (and the Preview on the other side):
                if (editorTabSelector !== preferredEditorTabView) {
                    editorTab = TabView.moveToTabView(editorLabel, preferredEditorTabView);
                    TabView.moveTabsAwayFrom(preferredEditorTabView, editorTab);
                }
                // For the initial view, hide the + menu of the Attributes tabView
                Y.one(TabView.getOppositeTabView(preferredEditorTabView) + " .wegas-plus-tab").show();
                Y.one(preferredEditorTabView + " .wegas-plus-tab").hide();
                editorTab.set("selected", 2);
                TabView.getTab(TabView.getPreviewTabLabel()).set("selected", 2);
            },
            // Return as an object a safe set of "left" attributes for the three columns
            initializeInitLeft: function() {
                var cfg = {
                        left : '0px',
                        center : this.getPosition('left').getComputedStyle('width'),
                        right : this.getPosition('right').getComputedStyle('left')
                    };
                return cfg;
            },
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

            // Translates '#centerTabView' into 'center' etc.
            getShortPositionName: function(position) {
                if (position.indexOf('center') >= 0) {
                    return 'center';
                } else if (position.indexOf('right') >= 0) {
                    return 'right';
                } else if(position.indexOf('left') >= 0) {
                    return 'left';
                } else if(position.indexOf('top') >= 0) {
                    return 'top';
                }
            },

            /**
             * @function
             * @private
             * @param position
             */
            hidePosition: function(position) {
                var node = this.getPosition(position);
                //if (!!this.get(position + ".animate")) {                          // False by default
                var currWidth = node.getComputedStyle("width");
                if (currWidth !== '0px') {
                    this.oldWidth[position] = node.getComputedStyle("width");
                }
                node.setStyle("left", this.initialLeft[position]);                                   // Reset left value

                node.setStyle("width", "0");
                this.syncCenterNode();
            },
            /**
             * @function
             * @private
             * @param position
             */
            showPosition: function(position) {
                var target = this.getPosition(position);
                if (parseInt(target.getStyle("width"), 10) < 70) {                  // If is hidden
                    target.setStyle("left", this.initialLeft[position]);            // Reset left value
                    var width = parseInt(this.oldWidth[position]) || this.get(position + ".width") || 430;
                        target.setStyle("width", width + "px");
                    if (position === "center") {
                        var rightNode = this.getPosition("right"),
                            rightWidth = parseInt(rightNode.getComputedStyle("width"));
                        rightNode.setStyle('width', (rightWidth - width) + 'px');
                    }
                    this.syncCenterNode();
                }
            },
            /**
             * @function
             * @private
             * @param position
             * @description Renders the given column/panel. NB: the order "left", "center", "right" is compulsory !
             */
            renderPosition: function(position) {
                var i, cWidget,
                    target = this.getPosition(position),
                    cfg = this.get(position);

                if (cfg) {                                                          // If there is a provided configuration
                    var windowWidth = window.innerWidth || document.documentElement.clientWidth;
                    if (this.editorCfg) {                                           // Or settings stored in the browser's localStorage ?
                        if (position === "left" && this.editorCfg.leftWidth) {
                            cfg.width = this.editorCfg.leftWidth;
                            if (parseInt(cfg.width) >= windowWidth) {
                                cfg.width = this.LEFT_COL_WIDTH;
                            }
                        } else if  (position === "center" && this.editorCfg.centerWidth) {
                            cfg.width = this.editorCfg.centerWidth;
                            if (parseInt(cfg.width) + parseInt(this.get("left").width) >= windowWidth) {
                                cfg.width = this.CENTER_COL_WIDTH;
                            }
                        } else if (position === "right") {
                            var leftWidth = parseInt(this.get("left").width),
                                centerWidth = parseInt(this.get("center").width),
                                otherColumns = leftWidth + centerWidth;
                            cfg.width = "calc(100% - " + otherColumns + "px)";
                        }
                    }
                    if (position !== "top") {
                        target.setStyle("width", cfg.width);
                    }
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
                            width: cfg.width || (windowWidth - parseInt(this.get("left.width")) - parseInt(this.get("center.width"))) + "px"
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
            syncCenterNode: function(e) {
                var leftNode = this.getPosition("left"),
                    centerNode = this.getPosition("center"),
                    rightNode = this.getPosition("right"),
                    centerWidthStyle = centerNode.getStyle('width'),
                    rightWidthStyle = rightNode.getStyle('width'),
                    leftWidth = leftNode.getComputedStyle("width"),
                    rightWidth = rightNode.getComputedStyle("width");
                // If center width style is set to zero, it shall remain hidden:
                if (centerWidthStyle !== '0px') {
                    centerNode.setStyles({
                        left: leftWidth,
                        right: rightNode.getComputedStyle("width"),
                        width: 'auto'
                    });
                    rightNode.setStyles({
                        left: 'auto'
                    });
                } else {
                    Y.Plugin.RemoveTabView.prototype.showRemoveTabViewIcons("center");
                    if (e && e.currentTarget.handle === 'l') {  // Left handle of right column has been moved
                        var windowWidth = parseInt(window.innerWidth || document.documentElement.clientWidth);
                        leftNode.setStyles({
                            width: parseInt(windowWidth - parseInt(rightWidth) + this.HANDLEBAR_WIDTH)
                        });
                    } else {                                    // Right handle of left column has been moved
                        rightNode.setStyles({
                            left: parseInt(leftWidth) - this.HANDLEBAR_WIDTH,
                            width: 'auto'
                        });
                    }
                }
                if (rightWidth === '0px' || rightWidthStyle === '0px') {
                    Y.Plugin.RemoveTabView.prototype.showRemoveTabViewIcons("right");
                }
                this.savePosition(leftWidth, centerNode.getComputedStyle("width"), rightWidth);
                Y.Wegas.app.fire("layout:resize");
            },
            // Save column config to localStorage:
            savePosition: function(leftWidth, centerWidth, rightWidth) {
                if (parseInt(centerWidth) !== 0 && parseInt(rightWidth) !== 0) {
                    this.editorCfg.leftWidth = leftWidth;
                    this.editorCfg.centerWidth = centerWidth;
                    localStorage.setItem(this.WEGAS_EDITOR_LOCALSTORAGE_ID, JSON.stringify(this.editorCfg));
                }
            },
            isHidden: function(position) {
                position = this.getShortPositionName(position);
                var node = this.getPosition(position);
                return node.getStyle("width") === '0px' || node.getComputedStyle("width") === '0px';
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
