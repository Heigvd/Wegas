/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add('treeview', function(Y) {
    "use strict";
    var getClassName = Y.ClassNameManager.getClassName,
            TREEVIEW = 'treeview',
            TREENODE = 'treenode',
            //TREELEAF = 'treeleaf',
            CONTENT_BOX = "contentBox",
            BOUNDING_BOX = "boundingBox",
            classNames = {
                loading: getClassName(TREENODE, "loading"),
                collapsed: getClassName(TREENODE, "collapsed"),
                visibleRightWidget: getClassName(TREEVIEW, "visible-right")
            },
    RIGHTWIDGETSETTERFN = function(v) {
        var rightWidget = this.get("rightWidget"),
                targetNode = this.get(BOUNDING_BOX).one(".yui3-tree-rightwidget");
        if (rightWidget !== v && rightWidget) {                             // Remove existing child
            if (rightWidget instanceof Y.Node) {                            // Case 1: Y.Node
                rightWidget.remove();
            } else {
                rightWidget.get(BOUNDING_BOX).remove(); // Case 2: Y.Widget
                rightWidget.removeTarget(this);
                this.set("parent", null);
            }
        }
        if (v) {                                                            // Append the new widget
            if (v instanceof Y.Node) {                                      // Case 1: Y.Node
                v.appendTo(targetNode);
            } else {                                                        // Case 2: Y.Widget
                if (v.get("rendered")) {
                    v.get(BOUNDING_BOX).appendTo(targetNode);
                } else {
                    v.render(targetNode);
                }
                v.set("parent", this);
                v.addTarget(this);
            }
        }
        return v;
    };
    /**
     * TreeView main class
     * <p><strong>Attributes</strong></p>
     * <ul>
     *    <li>visibleRightWidget {Boolean} should right widget be shown.</li>
     * </ul>
     * @name Y.TreeView
     * @class TreeView class
     * @extends Y.Widget#
     * @constructor
     * @param Object Will be used to fill attributes field
     */
    Y.TreeView = Y.Base.create("treeview", Y.Widget, [Y.WidgetParent], {
        /** @lends Y.TreeView# */
        BOUNDING_TEMPLATE: "<div></div>",
        CONTENT_TEMPLATE: "<ul></ul>",
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        bindUI: function() {
            this.on("*:click", function(e) {
                if (e.node && e.node !== this) {
                    this.deselectAll();
                    e.node.set("selected", 2);
                }
            });
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        renderUI: function() {
            if (this.get("visibleRightWidget")) {
                this.get(CONTENT_BOX).addClass(classNames.visibleRightWidget);
            }
        },
        /**
         * Expand all children
         * @public
         * @function
         * @returns {undefined}
         */
        expandAll: function() {
            this.each(function(item) {
                if (item.expandAll) {
                    item.expandAll();
                }
            });
        },
        /**
         * Collapse all children
         * @public
         * @function
         * @returns {undefined}
         */
        collapseAll: function() {
            this.each(function(item) {
                if (item.collapseAll) {
                    item.collapseAll();
                }
            });
        },
        saveState: function() {
            var State = {}, getChildsState = function(o, item, index) {
                if (item instanceof Y.TreeNode) {
                    o[index] = {"expanded": !item.get(BOUNDING_BOX).hasClass(classNames.collapsed)};
                    item.each(Y.bind(getChildsState, item, o[index]));
                }
            };
            this.each(Y.bind(getChildsState, this, State));
            return State;
        },
        applyState: function(State) {
            var setChildsState = function(o, item, index) {
                if (item instanceof Y.TreeNode) {
                    if (o[index]) {
                        if (o[index].expanded) {
                            item.expand(false);
                        } else if (o[index].expanded === false) {
                            item.collapse(false);
                        }
                        item.each(Y.bind(setChildsState, item, o[index]));
                    }


                }
            };
            this.each(Y.bind(setChildsState, this, State));
        }
    }, {
        /**
         * @lends Y.TreeView
         */
        NAME: 'treeview',
        ATTRS: {
            visibleRightWidget: {
                value: false,
                validator: Y.Lang.isBoolean
            },
            defaultChildType: {
                value: "TreeLeaf"
            },
            multiple: {
                value: false
            }
        }
    });
    /**
     * TreeView's TreeNode
     * <p><strong>Attributes</strong></p>
     * <ul>
     *    <li>label {String} The TreeNode's label</li>
     *    <li>collapsed {Boolean} Define if the node is collased. <i>Default:</i> false</li>
     *    <li>rightWidget {Widget} TreeNode's right widget</li>
     *    <li>loading {Boolean} is the node loading, will replace left icon. <i>Default:</i> false</li>
     *    <li>iconCSS {String} left icon's CSS class</li>
     * </ul>
     * @name Y.TreeNode
     * @class Base TreeNode class
     * @extends Y.Widget
     * @constructor
     * @param Object Will be used to fill attributes field
     */
    Y.TreeNode = Y.Base.create("treenode", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {
        /** @lends Y.TreeNode# */
        BOUNDING_TEMPLATE: "<li></li>",
        CONTENT_TEMPLATE: "<ul></ul>",
        /**
         * Lifecycle method
         * @private
         * @function
         */
        initializer: function() {
            this._childStore = [];
            this.publish("toggleClick", {
                bubbles: false,
                broadcast: false,
                defaultFn: this.toggleTree
            });
            this.publish("nodeExpanded", {
                bubbles: true
            });
            this.publish("nodeCollapsed", {
                bubbles: true
            });
            this.publish("iconClick", {
                bubbles: true
            });
            this.publish("labelClick", {
                bubbles: true
            });
            this.publish("click", {
                bubbles: true
            });
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        renderUI: function() {
            var bb = this.get(BOUNDING_BOX), header;
            header = Y.Node.create("<div class='content-header " + this.getClassName("content", "header") + "'></div>");
            bb.prepend(header);
            this.toggleNode = Y.Node.create("<span class='" + this.getClassName("content", "toggle") + "'></span>");
            this.iconNode = Y.Node.create("<span class='" + this.getClassName("content", "icon") + "'></span>");
            this.labelNode = Y.Node.create("<span class='" + this.getClassName("content", "label") + "'></span>");
            header.append(this.toggleNode);
            header.append(this.iconNode);
            header.append(this.labelNode);
            header.append("<div class=\"" + this.getClassName("content", "rightwidget") + " yui3-tree-rightwidget\">");
            if (this.get('collapsed') && !bb.hasClass(classNames.collapsed)) {
                bb.addClass(classNames.collapsed);
            }
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        bindUI: function() {
            /*
             * Force event firing for an exisiting and none 0 attribute
             * "selected" on initialization
             */
            this.onceAfter("renderedChange", function() {
                var val = this.get("selected");
                if (val && !this.get("selection")) {                            /* check for last selected node */
                    this.set("selected", 0);
                    this.set("selected", val);
                }
            });
            this.after("selectedChange", function(e) {
                if (e.newVal && !e.target.get("selection")) {
                    e.target.get(BOUNDING_BOX).addClass("selected");
                } else if (e.target.get(BOUNDING_BOX)._node) {
                    e.target.get(BOUNDING_BOX).removeClass("selected");
                }
            });
            this.toggleNode.on("click", function(e) {
                e.stopPropagation();
                this.fire("toggleClick", {
                    node: this
                });
            }, this);
            this.get(BOUNDING_BOX).one("." + this.getClassName("content", "header")).before("dblclick", function(e) {
                e.halt(true);
                this.toggleTree();
            }, this);
            this.get(BOUNDING_BOX).one("." + this.getClassName("content", "header")).on("click", function(e) {
                var node = e.target;
                e.stopPropagation();
                if (node.hasClass(this.getClassName("content", "icon"))) {
                    this.fire("iconClick", {
                        node: this
                    });
                }
                if (node.hasClass(this.getClassName("content", "label"))) {
                    this.fire("labelClick", {
                        node: this
                    });
                }
                this.fire("click", {
                    node: this,
                    domEvent: e
                });
            }, this);
            this.get(BOUNDING_BOX).on("click", function(e) {
                e.stopPropagation();
            });
            this.before("collapsedChange", function(e) {
                if (!e.newVal && e.target === this) {
                    while (this._childStore.length) {
                        Y.WidgetParent.prototype._add.apply(this, this._childStore.shift());
                    }
                }
            });
            this.after("collapsedChange", function(e) {
                if (e.target !== this) {
                    return;
                }
                if (e.newVal) {
                    if (e.fireEvent) {
                        this.fire("nodeCollapsed", {node: e.target});
                    }
                    this.get(BOUNDING_BOX).addClass(classNames.collapsed);
                } else {
                    if (e.fireEvent) {
                        this.fire("nodeExpanded", {node: e.target});
                    }
                    this.get(BOUNDING_BOX).removeClass(classNames.collapsed);
                }
            });
        },
        /**
         * Lifecycle method, sync attributes
         * @public
         * @function
         * @returns {undefined}
         */
        syncUI: function() {
            this.set("loading", this.get("loading"));
            this.set("iconCSS", this.get("iconCSS"));
            this.set("label", this.get("label"));
            this.set("tooltip", this.get("tooltip"));
            this.set("rightWidget", this.get("rightWidget"));
            this.set("collapsed", this.get("collapsed"));
            this.set("cssClass", this.get("cssClass"));
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        destructor: function() {
            this.blur(); //remove a focused node generates some errors
            this.set("selected", 0);
            if (this.get("rightWidget")) {
                this.get("rightWidget").destroy();
            }
        },
        /**
         * Toggle treeNode between collapsed and expanded. Fires an event "nodeCollapsed" / "nodeExpanded"
         * @public
         * @function
         * @returns {undefined}
         */
        toggleTree: function() {
            this.set("collapsed", !this.get("collapsed"), {fireEvent: true});
        },
        /**
         * Expand the treeNode
         * @public
         * @function
         * @param {Boolean} fireEvent specifies if an event should be fired. <i>Default:</i> true
         * @returns {undefined}
         */
        expand: function(fireEvent) {
            this.set("collapsed", false, {fireEvent: (fireEvent === undefined) ? true : fireEvent});
        },
        /**
         * Collapse the treeNode
         * @public
         * @function
         * @param {Boolean} fireEvent specifies if an event should be fired. <i>Default:</i> true
         * @returns {undefined}
         */
        collapse: function(fireEvent) {
            this.set("collapsed", true, {fireEvent: (fireEvent === undefined) ? true : fireEvent});
        },
        /**
         * Expand all subtree
         * @public
         * @function
         * @returns {undefined}
         */
        expandAll: function(fireEvent) {
            this.expand(fireEvent);
            this.each(function(item) {
                if (item.expandAll) {
                    item.expandAll(fireEvent);
                }
            });
        },
        /**
         * Collapse all subtree
         * @public
         * @function
         * @returns {undefined}
         */
        collapseAll: function(fireEvent) {
            this.collapse(fireEvent);
            this.each(function(item) {
                if (item.collapseAll) {
                    item.collapseAll(fireEvent);
                }
            });
        },
        /**
         * Destroy subtree
         * @public
         * @function
         * @returns {undefined}
         */
        destroyChildren: function() {
            this.removeAll().each(this.destroyChild, this);
        },
        /**
         * Destroy a specific child and it's subchild
         * @private
         * @function
         * @param {TreeNode|TreeLeaf} item to destroy
         * @returns {undefined}
         */
        destroyChild: function(item) {
            item.destroy();
        },
        /**
         * @private
         * @override Y.WidgetParent.prototype._add
         * @param {type} child
         * @param {type} index
         * @return {Array} description
         */
        _add: function(child, index) {
            if (this.get("collapsed")) {
                this._childStore.push([child, index]);
                return null;
            }
            return Y.WidgetParent.prototype._add.call(this, child, index);
        }
    }, {
        /** @lends Y.TreeNode */
        NAME: "TreeNode",
        ATTRS: {
            label: {
                value: "",
                validator: Y.Lang.isString,
                setter: function(v) {
                    if (this.labelNode) {
                        this.labelNode.setContent(v);
                    }
                    return v;
                }
            },
            tooltip: {
                value: "",
                validator: Y.Lang.isString,
                setter: function(v) {
                    if (v) {
                        this.get(BOUNDING_BOX).one(".content-header").setAttribute("title", v);
                    } else {
                        this.get(BOUNDING_BOX).one(".content-header").removeAttribute("title");
                    }
                }
            },
            initialSelected: {
                writeOnce: "initOnly"
            },
            collapsed: {
                value: true,
                validator: Y.Lang.isBoolean
            },
            tabIndex: {
                value: 1
            },
            rightWidget: {
                value: null,
                validator: function(o) {
                    return o instanceof Y.Widget || o instanceof Y.Node || o === null;
                },
                setter: RIGHTWIDGETSETTERFN
            },
            loading: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    if (v) {
                        this.get(BOUNDING_BOX).addClass(classNames.loading);
                    } else {
                        this.get(BOUNDING_BOX).removeClass(classNames.loading);
                    }
                    return v;
                }
            },
            iconCSS: {
                value: getClassName("treenode", "default-icon"),
                validator: Y.Lang.isString,
                setter: function(v) {
                    if (this.currentIconCSS) {
                        this.iconNode.removeClass(this.currentIconCSS);
                    }
                    this.iconNode.addClass(v);
                    this.currentIconCSS = v;
                    return v;
                }
            },
            cssClass: {
                setter: function(v) {
                    if (v) {
                        this.get(BOUNDING_BOX).addClass(v);
                    }
                    return v;
                }
            },
            defaultChildType: {
                value: "TreeLeaf"
            },
            multiple: {
                value: false
            },
            data: {}
        }
    });
    /**
     * TreeLeaf widget. Default child type for TreeView.
     * It extends  WidgetChild, please refer to it's documentation for more info.
     * <p><strong>Attributes</strong></p>
     * <ul>
     *    <li>label {String} The TreeNode's label</li>
     *    <li>rightWidget {Widget} TreeNode's right widget</li>
     *    <li>loading {Boolean} is the node loading, will replace left icon. <i>Default:</i> false</li>
     *    <li>iconCSS {String} left icon's CSS class</li>
     *    <li>editable {Boolean} label is editable. <i>Default:</i> false</li>
     * </ul>
     * @name Y.TreeLeaf
     * @class TreeView's TreeLeaf
     * @constructor
     * @uses Y.WidgetChild
     * @extends Y.Widget
     * @param {Object} config User configuration object.
     */
    Y.TreeLeaf = Y.Base.create("treeleaf", Y.Widget, [Y.WidgetChild], {
        /** @lends Y.TreeLeaf# */
        /**
         * @field
         * @private
         */
        CONTENT_TEMPLATE: "<div></div>",
        /**
         * @field
         * @private
         */
        BOUNDING_TEMPLATE: "<li></li>",
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        initializer: function() {
            this.events = {};
            this.publish("iconClick", {
                bubbles: true
            });
            this.publish("labelClick", {
                bubbles: true
            });
            this.publish("click", {
                bubbles: true
            });
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        renderUI: function() {
            var cb = this.get(CONTENT_BOX), header;
            header = Y.Node.create("<div class='content-header " + this.getClassName("content", "header") + "'></div>");
            cb.append(header);
            this.iconNode = Y.Node.create("<span class='" + this.getClassName("content", "icon") + "'></span>");
            this.labelNode = Y.Node.create("<span class='" + this.getClassName("content", "label") + "'></span>");
            header.append(this.iconNode);
            header.append(this.labelNode);
            header.append("<div class=\"" + this.getClassName("content", "rightwidget") + " yui3-tree-rightwidget\">");
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        bindUI: function() {
            this.onceAfter("renderedChange", function(e) {
                var val = this.get("selected");
                if (val) {
                    this.set("selected", 0);
                    this.set("selected", val);
                }
            });
            this.after("selectedChange", function(e) {
                if (e.newVal && !e.target.get("selection")) {
                    e.target.get(BOUNDING_BOX).addClass("selected");
                } else {
                    e.target.get(BOUNDING_BOX).removeClass("selected");
                }
            });
            this.events.fullClick = this.get(CONTENT_BOX).one("." + this.getClassName("content", "header")).on("click", function(e) {
                var node = e.target;
                e.stopImmediatePropagation();
                if (node.hasClass(this.getClassName("content", "icon"))) {
                    this.fire("iconClick", {
                        node: this
                    });
                }
                if (node.hasClass(this.getClassName("content", "label"))) {
                    this.fire("labelClick", {
                        node: this
                    });
                }
                this.fire("click", {
                    node: this,
                    domEvent: e
                });
            }, this);
            //one line, prevent special chars
            this.labelNode.on("blur", function(e) {
                e.target.setContent(e.target.getContent().replace(/&[^;]*;/gm, "").replace(/(\r\n|\n|\r|<br>|<br\/>)/gm, "").replace(/(<|>|\|\\|:|;)/gm, "").replace(/^\s+/g, '').replace(/\s+$/g, ''));
            }, this);
        },
        /**
         * Lifecycle method, sync attributes
         * @public
         * @function
         * @returns {undefined}
         */
        syncUI: function() {
            this.set("label", this.get("label"));
            this.set("tooltip", this.get("tooltip"));
            this.set("iconCSS", this.get("iconCSS"));
            this.set("editable", this.get("editable"));
            this.set("loading", this.get("loading"));
            this.set("rightWidget", this.get("rightWidget"));
            this.set("cssClass", this.get("cssClass"));
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        destructor: function() {
            this.blur(); //remove a focused node generates some errors
            this.set("selected", 0);
            if (this.get("rightWidget") && this.get("rightWidget").destroy) {
                try {
                    this.get("rightWidget").destroy();
                } catch (e) {
                }
            }
            this.iconNode.remove(true);
            this.labelNode.remove(true);
        }
    }, {
        /** @lends Y.TreeLeaf */
        NAME: "TreeLeaf",
        ATTRS: {
            label: {
                value: "",
                validator: Y.Lang.isString,
                setter: function(v) {
                    if (this.labelNode) {
                        this.labelNode.setContent(v);
                    }
                    return v;
                },
                getter: function(v) {
                    return this.labelNode.getContent();
                }
            },
            tooltip: {
                value: "",
                validator: Y.Lang.isString,
                setter: function(v) {
                    if (v) {
                        this.get(BOUNDING_BOX).one(".content-header").setAttribute("title", v);
                    } else {
                        this.get(BOUNDING_BOX).one(".content-header").removeAttribute("title");
                    }
                }
            },
            cssClass: {
                setter: function(v) {
                    if (v) {
                        this.get(BOUNDING_BOX).addClass(v);
                    }
                    return v;
                }
            },
            tabIndex: {
                value: -1
            },
            initialSelected: {
                writeOnce: "initOnly"
            },
            rightWidget: {
                value: null,
                validator: function(o) {
                    return o instanceof Y.Widget || o instanceof Y.Node || o === null;
                },
                setter: RIGHTWIDGETSETTERFN
            },
            editable: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    if (v) {
                        this.labelNode.setAttribute("contenteditable", "true");
                    } else {
                        this.labelNode.setAttribute("contenteditable", "false");
                    }
                    return v;
                }
            },
            loading: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    if (v) {
                        this.get(CONTENT_BOX).addClass(classNames.loading);
                    } else {
                        this.get(CONTENT_BOX).removeClass(classNames.loading);
                    }
                    return v;
                }
            },
            iconCSS: {
                value: getClassName("treeleaf", "default-icon"),
                validator: Y.Lang.isString,
                setter: function(v) {
                    if (this.currentIconCSS) {
                        this.iconNode.removeClass(this.currentIconCSS);
                    }
                    this.iconNode.addClass(v);
                    this.currentIconCSS = v;
                    return v;
                }
            },
            data: {}
        }
    });
});
