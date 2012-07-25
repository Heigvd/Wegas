/**
 *
 *
 */

YUI.add('treeview', function (Y) {
    var getClassName = Y.ClassNameManager.getClassName,
    TREEVIEW = 'treeview',
    TREENODE = 'treenode'
    TREELEAF = 'treeleaf',
    CONTENT_BOX = "contentBox",
    BOUNDING_BOX = "boundingBox",
    classNames = {
        loading : getClassName(TREENODE, "loading"),
        collapsed : getClassName(TREENODE,"collapsed")
    },
    RIGHTWIDGETSETTERFN = function (v){
        if(this.get("rightWidget") !== v && this.get("rightWidget")){// Remove existing child
            if (this.get("rightWidget") instanceof Y.node) {        // Case 1: Y.Node
                this.get("rightWidget").remove();
            } else {
                this.get("rightWidget").get(BOUNDING_BOX).remove(); // Case 2: Y.Widget
                this.get("rightWidget").removeTarget(this);
                this.set("parent", null);
            }
        }
        if (v) {                                                    // Append the new widget
            if (v instanceof Y.Node) {                              // Case 1: Y.Node
                v.appendTo("#" + this.get("id") + "_right");
            } else {                                                // Case 2: Y.Widget
                if(v.get("rendered")){
                    v.get(BOUNDING_BOX).appendTo("#" + this.get("id") + "_right");
                }else {
                    v.render("#" + this.get("id") + "_right");
                }
                v.set("parent", this);
                v.addTarget(this);
            }
        }
        return v;
    };

    Y.TreeView = Y.Base.create("treeview", Y.Widget, [Y.WidgetParent],
    {
        BOUNDING_TEMPLATE: "<div></div>",
        CONTENT_TEMPLATE: "<ul></ul>",

        initializer : function() {
        },
        bindUI : function() {
        },
        renderUI:function() {
        }
    }, {
        NAME:'treeview',
        ATTRS:{
        },
        defaultChildType: {
            value: "TreeLeaf"
        }
    });

    Y.TreeNode = Y.Base.create("treenode", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<li></li>",
        CONTENT_TEMPLATE: "<ul></ul>",
        toggleNode: null,
        labelNode: null,
        iconNode: null,
        currentIconCSS: null,
        menuNode: null,
        eventInstances: {},

        initializer : function () {
            this.publish("toggleClick",{
                bubbles: false,
                broadcast: false,
                defaultFn: this.toggleTree
            });
            this.publish("nodeExpanded", {
                broadcast: true
            });
            this.publish("nodeCollapsed", {
                broadcast: true
            });
        },

        renderUI : function() {
            var cb = this.get(CONTENT_BOX), header;
            header = Y.Node.create("<div class='" + this.getClassName("content", "header") + "'></div>");
            cb.append(header);
            this.toggleNode = Y.Node.create("<span class='" + this.getClassName("content", "toggle") + "'></span>");
            this.iconNode = Y.Node.create("<span class='" + this.getClassName("content", "icon") + "'></span>");
            this.labelNode = Y.Node.create("<span class='" + this.getClassName("content", "label") + "'></span>");
            header.append(this.toggleNode);
            header.append(this.iconNode);
            header.append(this.labelNode);
            header.append("<div id=\"" + this.get("id") + "_right\" class=\"" + this.getClassName("content", "rightwidget") + "\">");
            if(this.get('collapsed') && !cb.hasClass(classNames.collapsed)){
                cb.addClass(classNames.collapsed);
            }
        },

        bindUI: function() {
            this.eventInstances.click = this.toggleNode.on("click", function(e){
                e.stopImmediatePropagation();
                this.fire("toggleClick", {
                    node: this
                });
            },
            this);
        },

        syncUI:function(){
            this.set("loading", this.get("loading"));
            this.set("iconCSS", this.get("iconCSS"));
            this.set("label", this.get("label"));
            this.set("rightWidget", this.get("rightWidget"));
            this.set("collapsed", this.get("collapsed"));
        },

        destructor: function() {
            for(var event in this.eventInstances){
                this.eventInstances[event].detach();
            }
            if(this.get("rightWidget")){
                this.get("rightWidget").destroy();
            }
            this.toggleNode.destroy();
            this.labelNode.destroy();
            this.iconNode.destroy();

        },

        toggleTree : function() {
            this.get(CONTENT_BOX).toggleClass(classNames.collapsed);
            if(this.get(CONTENT_BOX).hasClass(classNames.collapsed)){
                this.fire('nodeCollapsed', {
                    node:this
                });
            }else{
                this.fire('nodeExpanded', {
                    node:this
                });
            }
        },

        expand: function (fireEvent) {
            this.set("collapsed", false);
            fireEvent = (fireEvent == null) ? true : fireEvent;
            if(fireEvent){
                this.fire('nodeExpanded', {
                    node:this
                });
            }
        },

        collapse: function (fireEvent) {
            this.set("collapsed", true);
            fireEvent = (fireEvent == null) ? true : fireEvent;
            if(fireEvent){
                this.fire('nodeCollapsed', {
                    node:this
                });
            }
        },

        destroyChildren: function() {
            var widgets = this.removeAll();
            for (var i in widgets){
                widgets.each(this.destroyChild, this);
            }
        },
        destroyChild: function (item, index){
            item.destroy();
        }
    }, {
        NAME : "TreeNode",
        ATTRS : {
            label : {
                value: "",
                validator: Y.Lang.isString,
                setter: function (v){
                    this.labelNode.setContent(v);
                    return v;
                }
            },
            collapsed : {
                value : true,
                validator : Y.Lang.isBoolean,
                setter: function (v){
                    if(v){
                        this.get(CONTENT_BOX).addClass(classNames.collapsed);
                    }else{
                        this.get(CONTENT_BOX).removeClass(classNames.collapsed);
                    }
                    return v;
                }
            },
            rightWidget : {
                value: null,
                validator: function(o){
                    return o instanceof Y.Widget || o instanceof Y.Node || o === null;
                },
                setter: RIGHTWIDGETSETTERFN
            },
            loading : {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function (v){
                    if(v){
                        this.get(CONTENT_BOX).addClass(classNames.loading);
                    }else{
                        this.get(CONTENT_BOX).removeClass(classNames.loading);
                    }
                    return v;
                }
            },
            iconCSS: {
                value: getClassName("treenode", "default-icon"),
                validator: Y.Lang.isString,
                setter: function (v){
                    if(this.currentIconCSS){
                        this.iconNode.removeClass(this.currentIconCSS);
                    }
                    this.iconNode.addClass(v);
                    this.currentIconCSS = v;
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
     * @class TreeLeaf
     * @constructor
     * @uses WidgetChild
     * @extends Widget
     * @param {Object} config User configuration object.
     */
    Y.TreeLeaf = Y.Base.create("treeleaf", Y.Widget, [Y.WidgetChild], {


        CONTENT_TEMPLATE : "<div></div>",
        BOUNDING_TEMPLATE : "<li></li>",
        menuNode: null,
        iconNode: null,
        currentIconCSS: null,
        labelNode: null,
        events: {},

        initializer : function () {
            this.publish("iconClick",{
                broadcast: true
            });
            this.publish("labelClick",{
                broadcast: true
            });
            this.publish("click",{
                broadcast: true
            });
        },

        renderUI: function () {
            var cb = this.get(CONTENT_BOX), header;
            header = Y.Node.create("<div class='" + this.getClassName("content", "header") + "'></div>");
            cb.append(header);
            this.iconNode = Y.Node.create("<span class='" + this.getClassName("content", "icon") + "'></span>");
            this.labelNode = Y.Node.create("<span class='" + this.getClassName("content", "label") + "'></span>");
            header.append(this.iconNode);
            header.append(this.labelNode);
            header.append("<div id=\"" + this.get("id") + "_right\" class=\"" + this.getClassName("content", "rightwidget") + "\">");
        },
        bindUI: function () {
            this.events.labelClick = this.labelNode.on("click",function(e){
                e.stopImmediatePropagation();
                this.fire("labelClick", {
                    node:this
                });
                this.fire("click", {
                    node: this,
                    domEvent: e
                });
            },this);
            this.events.labelClick = this.iconNode.on("click",function(e){
                e.stopImmediatePropagation();
                this.fire("iconClick", {
                    node: this
                });
                this.fire("click", {
                    node: this,
                    domEvent: e
                });
            },this);
        },
        syncUI: function () {
            this.set("label", this.get("label"));
            this.set("iconCSS", this.get("iconCSS"));
            this.set("editable", this.get("editable"));
            this.set("loading", this.get("loading"));
            this.set("rightWidget", this.get("rightWidget"));
        },

        destructor: function () {
            if(this.get("rightWidget")){
                this.get("rightWidget").destroy();
            }
            this.iconNode.destroy();
            this.labelNode.destroy();
        }
    }, {
        NAME : "TreeLeaf",
        ATTRS : {
            label: {
                value:"",
                validator: Y.Lang.isString,
                setter: function (v){
                    this.labelNode.setContent(v);
                },
                getter: function (v){
                    return this.labelNode.getContent();
                }
            },
            tabIndex: {
                value: -1
            },
            rightWidget: {
                value: null,
                validator: function(o){
                    return o instanceof Y.Widget || o instanceof Y.Node || o === null;
                },
                setter: RIGHTWIDGETSETTERFN
            },
            editable:{
                value:false,
                validator:Y.Lang.isBoolean,
                setter: function (v){
                    if(v){
                        this.labelNode.setAttribute("contenteditable", "true");
                    }else{
                        this.labelNode.setAttribute("contenteditable", "false");
                    }
                    return v;
                }
            },
            loading : {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function (v){
                    if(v){
                        this.get(CONTENT_BOX).addClass(classNames.loading);
                    }else{
                        this.get(CONTENT_BOX).removeClass(classNames.loading);
                    }
                    return v;
                }
            },
            iconCSS: {
                value: getClassName("treeleaf", "default-icon"),
                validator: Y.Lang.isString,
                setter: function (v){
                    if(this.currentIconCSS){
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
