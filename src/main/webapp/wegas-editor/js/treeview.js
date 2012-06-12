YUI.add('treeview', function (Y) {
    var getClassName = Y.ClassNameManager.getClassName,
    TREEVIEW = 'treeview',
    TREENODE = 'treenode'
    TREELEAF = 'treeleaf',
    CONTENT_BOX = "contentBox",
    BOUNDING_BOX = "boundingBox",
    classNames = {
        loading : getClassName(TREEVIEW,'loading'),
        collapsed : getClassName(TREENODE,"collapsed")
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
    },
    {
        NAME:'treeview',
        ATTRS:{

    }
    });

    Y.TreeNode = Y.Base.create("treenode", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<li></li>",
        CONTENT_TEMPLATE: "<ul></ul>",

        labelNode: null,
        menuNode: null,
        eventInstances: {},

        initializer : function () {
            this.publish("nodeClick",{
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
            var cb = this.get(CONTENT_BOX);
            if(this.get("label")){
                this.labelNode = Y.Node.create("<span class='" + this.getClassName("content", "label") + "'>" + this.get("label") + "</span>");
                cb.append(this.labelNode);
            }
            if(this.get("rightWidget")){
                this.menuNode = this.get("rightWidget");
                cb.append("<div id=\"" + this.get("id") + "_right\" class=\"" + this.getClassName("content", "rightwidget") + "\">");
                this.menuNode.render("#" + this.get("id") + "_right");
            }
            if(this.get('collapsed') && !cb.hasClass(classNames.collapsed)){
                cb.addClass(classNames.collapsed);
            }
        },

        bindUI: function() {
            this.eventInstances.click = this.labelNode.on("click", function(e){
                e.stopImmediatePropagation();
                this.fire("nodeClick", {
                    node: this
                });
            },
            this);
        },

        destructor: function() {
            for(var event in this.eventInstances){
                this.eventInstances[event].detach();
            }
            if(this.menuNode){
                this.menuNode.destroy();
            }
            if(this.labelNode){
                this.labelNode.destroy();
            }
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

        destroyChildren: function() {
            while (this.size() > 0) {
                this.item(0).destroy();
            }

        }
    },

    {
        NAME : "treenode",
        ATTRS : {
            label : {
                validator: Y.Lang.isString
            },
            collapsed : {
                value : true,
                validator : Y.Lang.isBoolean
            },
            rightWidget : {
                value: null,
                validator: function(o){
                    return o instanceof Y.Widget;
                }
            }
        }
    }
    );

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
        labelNode: null,

        initializer : function () {
        },

        renderUI: function () {
            var cb = this.get(CONTENT_BOX);
            if(this.get("label")){
                this.labelNode = Y.Node.create("<span class='" + this.getClassName("content", "label") + "'>" + this.get("label") + "</span>");
                cb.append(this.labelNode);
            }
            if(this.get("rightWidget")){
                this.menuNode = this.get("rightWidget");
                cb.append("<div id=\"" + this.get("id") + "_right\" class=\"" + this.getClassName("content", "rightwidget") + "\">");
                this.menuNode.render("#" + this.get("id") + "_right");
            }
        },

        destructor: function () {
            if(this.menuNode){
                this.menuNode.destroy();
            }
            if(this.labelNode){
                this.labelNode.destroy();
            }
        }
    }, {
        NAME : "treeleaf",
        ATTRS : {
            label: {
                validator: Y.Lang.isString
            },
            tabIndex: {
                value: -1
            },
            rightWidget: {
                value: null,
                validator: function(o){
                    return o instanceof Y.Widget;
                }
            }
        }
    });
});
