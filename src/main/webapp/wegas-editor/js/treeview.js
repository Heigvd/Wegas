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
        eventInstances: {},

        initializer : function (config) {
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
            this.labelNode = Y.Node.create("<span class='" + this.getClassName("content") + "-label'>" + this.get("label") + "</span>");
            this.eventInstances.click = this.labelNode.on("click", function(e){
                e.stopImmediatePropagation();
                this.fire("nodeClick", {
                    node: this
                });
            },
            this);
        },

        renderUI : function() {

            if(this.get("label")){
                this.get(CONTENT_BOX).append(this.labelNode);
            }
            if(this.get("menu")){
                this.get(CONTENT_BOX).append("<div class='" + getClassName("treenode", "content") + "-menu'>menu</div>");

            }
            if(this.get('collapsed') && !this.get(CONTENT_BOX).hasClass(classNames.collapsed)){
                this.get(CONTENT_BOX).addClass(classNames.collapsed);
            }
        },

        bindUI: function() {
        },

        destructor: function() {
            for(var event in this.eventInstances){
                this.eventInstances[event].detach();
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


        CONTENT_TEMPLATE : "<span></span>",

        BOUNDING_TEMPLATE : "<li></li>",

        initializer : function () {
        },

        renderUI: function () {
            this.get(CONTENT_BOX).setContent(this.get("label"));
        }
    }, {
        NAME : "treeleaf",
        ATTRS : {
            label : {
                validator: Y.Lang.isString
            },
            tabIndex: {
                value: -1
            }
        }
    });
});
