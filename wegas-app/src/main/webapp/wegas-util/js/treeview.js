/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add("treeview", function(Y) {
    "use strict";

    var HOST = "host",
        SELECTED = "selected",
        SELECTION = "selection",
        TREEVIEW = "treeview",
        TREENODE = "treenode",
        CONTENT = "content",
        CONTENT_BOX = "contentBox",
        BOUNDING_BOX = "boundingBox",
        getClassName = Y.ClassNameManager.getClassName,
        classNames = {
            loading: getClassName(TREENODE, "loading"),
            collapsed: getClassName(TREENODE, "collapsed"),
            visibleRightWidget: getClassName(TREEVIEW, "visible-right"),
            multiSelect: getClassName(TREEVIEW, "multiselect"),
            emptyMSG: getClassName(TREEVIEW, "empty-msg")
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
    Y.TreeView = Y.Base.create(TREEVIEW, Y.Widget, [Y.WidgetParent], {
        /** @lends Y.TreeView# */
        CONTENT_TEMPLATE: "<ul></ul>",
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        initializer: function() {
            this.publish("nodeClick", {
                defaultFn: function(e) {
                    this.deselectAll();
                    e.node.set(SELECTED, 2);
                }
            });
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        bindUI: function() {
            //this.after("*:addChild", function(e) {
            /* Selection is not updated if a child with selected attribute is added, force it.
             if (e.target.get(SELECTION)){
             e.target._set(SELECTION, e.target.get(SELECTION));
             }*/
            //    e.target._set(SELECTION, e.target.get(SELECTION));
            //});
            this.after("addChild", function() {
                this.get(BOUNDING_BOX).all("." + classNames.emptyMSG).remove(true);
            });
            this.after("removeChild", function() {
                if (!this.size()) {
                    this.get(BOUNDING_BOX).append("<div class='" + classNames.emptyMSG + "'>" + this.get("emptyMsg") +
                        "</div>");
                }
            });
            this.get(CONTENT_BOX).delegate("click", function(e) {
                var node = e.target,
                    widget = Y.Widget.getByNode(e.currentTarget);
                e.stopPropagation();
                if (node.hasClass(widget.getClassName(CONTENT, "icon"))) {
                    this.fire("iconClick", {
                        node: widget,
                        domEvent: e
                    });
                } else if (node.hasClass(widget.getClassName(CONTENT, "label"))) {
                    widget.fire("labelClick", {
                        node: widget,
                        domEvent: e
                    });
                } else if (node.ancestor().hasClass(widget.getClassName(CONTENT, "extra"))) {
                    widget.fire("extraClick", {
                        node: node,
                        widget: widget,
                        domEvent: e
                    });
                    return;
                } else if (node.hasClass(widget.getClassName(CONTENT, "toggle"))) {
                    widget.fire("toggleClick", {
                        node: widget,
                        domEvent: e
                    });
                    return;
                }
                widget.fire("click", {
                    node: widget,
                    domEvent: e
                });
                this.fire("nodeClick", {
                    node: widget,
                    domEvent: e
                });
            }, ".content-header", this);
            this.get(CONTENT_BOX).delegate("dblclick", function(e) {
                e.halt(true);
                Y.Widget.getByNode(e.currentTarget).toggleTree();
            }, "." + getClassName(TREENODE, CONTENT, "header"));
            //Render child before expand
            this.before("treenode:collapsedChange", function(e) {
                var renderTo;
                if (!e.newVal && e.target.get("rendered")) {
                    renderTo = e.target._childrenContainer;
                    e.target.each(function(child) {
                        child.render(renderTo);
                    });
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
            if (!this.size()) {
                this.get(BOUNDING_BOX).append("<div class='" + classNames.emptyMSG + "'>" + this.get("emptyMsg") +
                    "</div>");
            }
        },
        syncUI: function() {
            this.each(function(child) {
                var s = child.get(SELECTED);
                if (s) {
                    this._updateSelection({
                        target: child,
                        newVal: s
                    });
                }

            }, this);
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
        getSelection: function() {
            var selection = this.get(SELECTION);
            if (selection) {
                while (selection.item(0).get(SELECTION)) {
                    selection = selection.item(0).get(SELECTION);
                }
            }
            return selection;
        },
        saveState: function() {
            var state = {},
                getChildsState = function(o, item, index) {
                    if (item instanceof Y.TreeNode) {
                        o[index] = {
                            expanded: !item.get("collapsed")
                        };
                        item.each(Y.bind(getChildsState, item, o[index]));
                    }
                };
            this.each(Y.bind(getChildsState, this, state));
            return state;
        },
        applyState: function(state) {
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
            this.each(Y.bind(setChildsState, this, state));
        },
        /**
         *
         * @param {type} testFn
         * @returns {Y.TreeNode|Y.TreeLeaf}
         */
        find: function(testFn) {
            var find = function(widget) {
                if (testFn(widget)) {
                    return widget;
                }
                if (widget.each) { // Is a treeview or a treenode
                    for (var i = 0; i < widget.size(); i += 1) {
                        var test = find(widget.item(i));
                        if (test) {
                            return test;
                        }
                    }
                }
                return null;
            };
            return find(this);
        }
    }, {
        /**
         * @lends Y.TreeView
         */
        NAME: TREEVIEW,
        ATTRS: {
            visibleRightWidget: {
                value: false,
                validator: Y.Lang.isBoolean
            },
            defaultChildType: {
                value: "TreeLeaf"
            },
            multiple: {
                value: true,
                readOnly: true
            },
            emptyMsg: {
                value: "Empty",
                setter: function(v) {
                    this.get(BOUNDING_BOX).all("." + classNames.emptyMSG).setHTML(v);
                    return v;
                }
            }
        },
        RIGHTWIDGETSETTERFN: function(v) {
            var rightWidget = this.get("rightWidget"),
                targetNode = this.get(BOUNDING_BOX).one(".yui3-tree-rightwidget");

            if (rightWidget !== v && rightWidget) { // Remove existing child
                if (rightWidget instanceof Y.Node) { // Case 1: Y.Node
                    rightWidget.remove();
                } else {
                    rightWidget.get(BOUNDING_BOX).remove(); // Case 2: Y.Widget
                    rightWidget.removeTarget(this);
                    this.set("parent", null);
                }
            }
            if (v) { // Append the new widget
                if (v instanceof Y.Node) { // Case 1: Y.Node
                    v.appendTo(targetNode);
                } else { // Case 2: Y.Widget
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
        BOUNDING_TEMPLATE: "<li>"
            + "<div class='content-header yui3-treenode-content-header'>"
            + "<span class='yui3-treenode-content-toggle'></span>"
            + "<span class='yui3-treenode-content-icon'></span>"
            + "<span class='yui3-treenode-content-label'></span>"
            + "<span class='yui3-treenode-content-extra'></span>"
            + "<div class=\"yui3-treenode-content-rightwidget yui3-tree-rightwidget\">"
            + "</div></li>",
        CONTENT_TEMPLATE: "<ul></ul>",
        /**
         * Lifecycle method
         * @private
         * @function
         */
        initializer: function() {
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
            this.publish("extraClick", {
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
            if (this.get("collapsed")) {
                this.get(BOUNDING_BOX).addClass(classNames.collapsed);
            }
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        bindUI: function() {
            this.after("collapsedChange", function(e) {
                if (e.target !== this) {
                    return;
                }
                if (e.newVal) {
                    this.get(BOUNDING_BOX).addClass(classNames.collapsed);
                    if (e.fireEvent) {
                        this.fire("nodeCollapsed", {
                            node: e.target
                        });
                    }
                } else {
                    this.get(BOUNDING_BOX).removeClass(classNames.collapsed);
                    if (e.fireEvent) {
                        this.fire("nodeExpanded", {
                            node: e.target
                        });
                    }
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
            this.set("childrenShortcut", this.get("childrenShortcut"));
            this.set("tooltip", this.get("tooltip"));
            this.set("rightWidget", this.get("rightWidget"));
            this.set("collapsed", this.get("collapsed"));
            this.set("cssClass", this.get("cssClass"));
            this.each(function(child) {
                var s = child.get(SELECTED);
                if (s) {
                    this._updateSelection({
                        target: child,
                        newVal: s
                    });
                }

            }, this);
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        destructor: function() {
            this.blur(); //remove a focused node generates some
            // errors
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
            this.set("collapsed", !this.get("collapsed"), {
                fireEvent: true
            });
        },
        expandParents: function() {
            if (!this.isRoot()) {
                var parent = this.get("parent");
                if (parent.expandParents) {
                    parent.expand();
                    parent.expandParents();
                }
            }
        },
        /**
         * Expand the treeNode
         * @public
         * @function
         * @param {Boolean} fireEvent specifies if an event should be fired. <i>Default:</i> true
         * @returns {undefined}
         */
        expand: function(fireEvent) {
            this.set("collapsed", false, {
                fireEvent: fireEvent
            });
        },
        /**
         * Collapse the treeNode
         * @public
         * @function
         * @param {Boolean} fireEvent specifies if an event should be fired. <i>Default:</i> true
         * @returns {undefined}
         */
        collapse: function(fireEvent) {
            this.set("collapsed", true, {
                fireEvent: fireEvent
            });
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
         * Only render Child on opened tree
         * @private
         * @override Y.WidgetParent.prototype._uiAddChild
         * @param {type} child
         * @param {type} parentNode
         */
        _uiAddChild: function(child, parentNode) {
            if (!this.get("collapsed")) {
                Y.WidgetParent.prototype._uiAddChild.call(this, child, parentNode);
            }
        },
        /**
         * Only render Children on opened tree
         * @private
         * @override Y.WidgetParent.prototype._renderChildren
         */
        _renderChildren: function() {
            var renderTo = this._childrenContainer || this.get("contentBox");

            this._childrenContainer = renderTo;
            if (!this.get("collapsed")) {
                this.each(function(child) {
                    child.render(renderTo);
                });
            }
        }
    }, {
        /** @lends Y.TreeNode */
        NAME: "TreeNode",
        ATTRS: {
            label: {
                value: "",
                validator: Y.Lang.isString,
                setter: function(v) {
                    this.get(BOUNDING_BOX).one(".yui3-treenode-content-label").setContent(v);
                    return v;
                }
            },
            childrenShortcut: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    if (v) {
                        this.get(BOUNDING_BOX).one(".yui3-treenode-content-extra").setContent(
                            "<span class='add-child-shortcut fa fa-plus-circle'></span>");
                    }
                    return v;
                }
            },
            selected: {
                setter: function(v) {
                    if (this.get(BOUNDING_BOX)._node) {
                        this.get(BOUNDING_BOX).removeClass(SELECTED)
                            .removeClass("sub-partially-selected")
                            .removeClass("sub-fully-selected");
                        if (v && !this.get(SELECTION)) {
                            this.get(BOUNDING_BOX).addClass(SELECTED);
                        } else if (v === 2) {
                            this.get(BOUNDING_BOX).addClass("sub-partially-selected");
                        } else if (v === 1) {
                            this.get(BOUNDING_BOX).addClass("sub-fully-selected");
                        }
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
                setter: Y.TreeView.RIGHTWIDGETSETTERFN
            },
            loading: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    this.get(BOUNDING_BOX).toggleClass(classNames.loading, v);
                    return v;
                }
            },
            iconCSS: {
                value: getClassName("treenode", "default-icon"),
                validator: Y.Lang.isString,
                setter: function(v) {
                    var iconNode = this.get(BOUNDING_BOX).one(".yui3-treenode-content-icon");
                    if (this.currentIconCSS) {
                        iconNode.removeClass(this.currentIconCSS);
                    }
                    iconNode.addClass(v);
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
        CONTENT_TEMPLATE: "<div><div class='content-header yui3-treeleaf-content-header'>"
            + "<span class='yui3-treeleaf-content-icon'></span>"
            + "<span class='yui3-treeleaf-content-label'></span>"
            + "<div class=\"yui3-treeleaf-content-rightwidget yui3-tree-rightwidget\"></div>"
            + "</div></div>",
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
        bindUI: function() {
            //one line, prevent special chars
            this.get(CONTENT_BOX).on("blur", function(e) {
                e.currentTarget.setContent(e.target.getContent().replace(/&[^;]*;/gm,
                    "").replace(/(\r\n|\n|\r|<br>|<br\/>)/gm, "").replace(/(<|>|\|\\|:|;)/gm, "").replace(/^\s+/g,
                    '').replace(/\s+$/g, ''));
            }, "." + this.getClassName(CONTENT, "label"), this);
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
        expandParents: function() {
            if (!this.isRoot()) {
                var parent = this.get("parent");
                if (parent.expandParents) {
                    parent.expand();
                    parent.expandParents();
                }
            }
        },
        /**
         * Lifecycle method
         * @private
         * @function
         * @returns {undefined}
         */
        destructor: function() {
            this.blur(); //remove a focused node generates some
            // errors
            this.set(SELECTED, 0);
            if (this.get("rightWidget") && this.get("rightWidget").destroy) {
                try {
                    this.get("rightWidget").destroy();
                } catch (e) {
                }
            }
        }
    }, {
        /** @lends Y.TreeLeaf */
        NAME: "TreeLeaf",
        ATTRS: {
            label: {
                value: "",
                validator: Y.Lang.isString,
                setter: function(v) {
                    this.get(BOUNDING_BOX).one(".yui3-treeleaf-content-label").setContent(v);
                    return v;
                },
                getter: function() {
                    return this.get(BOUNDING_BOX).one(".yui3-treeleaf-content-label").getContent();
                }
            },
            selected: {
                setter: function(v) {
                    if (!this.get("destroyed")) {
                        this.get(BOUNDING_BOX).toggleClass(SELECTED, v);
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
                setter: Y.TreeView.RIGHTWIDGETSETTERFN
            },
            editable: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    this.get(BOUNDING_BOX).one(".yui3-treeleaf-content-label").setAttribute("contenteditable",
                        v ? "true" : "false");
                    return v;
                }
            },
            loading: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    this.get(CONTENT_BOX).toggleClass(classNames.loading, v);
                    return v;
                }
            },
            iconCSS: {
                value: getClassName("treeleaf", "default-icon"),
                validator: Y.Lang.isString,
                setter: function(v) {
                    var iconNode = this.get(BOUNDING_BOX).one(".yui3-treeleaf-content-icon");
                    if (this.currentIconCSS) {
                        iconNode.removeClass(this.currentIconCSS);
                    }
                    iconNode.addClass(v);
                    this.currentIconCSS = v;
                    return v;
                }
            },
            data: {}
        }
    });

    /**
     * TreeView plugin, if a team select all players.
     * Toggle selection on click
     */
    Y.Plugin.TeamSelection = Y.Base.create("TeamSelection", Y.Plugin.Base, [], {
        initializer: function() {
            this.get(HOST).each(function(child) {
                if (child.get(SELECTED)) {
                    child.set(SELECTED, 1);
                }
            });
            this.onceAfterHostEvent("render", function() {
                this.afterHostEvent("treeleaf:selectedChange", function(e) {
                    if (e.newVal > 0) {
                        e.target.get("parent").selectAll();
                    } else {
                        e.target.get("parent").deselectAll();
                    }
                });
                this.afterHostEvent("nodeClick", function(e) {
                    e.node.set("selected", 1);
                });
            });
        }
    }, {
        NS: "teamselect"
    });
    /**
     * TreeView plugin, nodes will react like checkboxes.
     * Toggle selection on click
     */
    Y.Plugin.CheckBoxTV = Y.Base.create("CheckBoxTv", Y.Plugin.Base, [], {
        initializer: function() {
            this.onHostEvent("nodeClick", function(e) {
                e.preventDefault();
                if (e.node && e.node !== this.get(HOST)) {
                    e.node.set(SELECTED, e.node.get(SELECTED) ? 0 : 1);
                }
            });
            this.get(HOST).get(BOUNDING_BOX).addClass(classNames.multiSelect);
        },
        destructor: function() {
            this.get(HOST).get(BOUNDING_BOX).removeClass(classNames.multiSelect);
        }
    }, {
        NS: "treeviewselect"
    });
    /**
     * Treeview plugin, hold CTRL key to select multiple nodes
     */
    Y.Plugin.CTRLSelectTV = Y.Base.create("CTRLSelectTV", Y.Plugin.Base, [], {
        initializer: function() {
            this.onHostEvent("nodeClick", function(e) {
                e.preventDefault();
                if (!e.domEvent.ctrlKey) {
                    this.deselectAll();
                }
                if (e.node && e.node !== this) {
                    e.node.set(SELECTED, e.node.get(SELECTED) ? 0 : 1);
                }
            }, this.get(HOST));
            this.get(HOST).get(BOUNDING_BOX).addClass(classNames.multiSelect);
        },
        destructor: function() {
            this.get(HOST).get(BOUNDING_BOX).removeClass(classNames.multiSelect);
        }
    }, {
        NS: "treeviewselect"
    });
});
