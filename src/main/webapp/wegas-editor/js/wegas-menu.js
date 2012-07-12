YUI.add('wegas-menu', function (Y) {
    'use strict';

    var WegasMenu,
    CONTENT_BOX="contentBox";


    WegasMenu = Y.Base.create("wegas-menu", Y.Widget, [Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<div></div>",
        CONTENT_TEMPLATE:"<ul></ul>",
        nodeInstances: null,
        eventInstances: null,
        clickHandler: null,

        initializer: function () {
            this.nodeInstances = [];
            this.eventInstances = [];
            this.publish("itemClick", {
                emitFacade: true,
                bubbles: true
            });
        },
        renderUI: function () {
            var listItem, item;
            for (var i in this.get("items")){
                item = this.get("items")[i];
                listItem = this.itemCreator(item);
                this.get(CONTENT_BOX).append(listItem);
                this.nodeInstances.push(listItem);
            }
        },
        bindUI: function () {
            this.clickHandler = this.get(CONTENT_BOX).delegate('click', function(e) {					// Listen for click events on the table
                e.stopImmediatePropagation();
                this.fire("itemClick", {
                    parent: this.get("parent"),
                    item:  e.currentTarget.nodeName,
                    params: this.get('params')
                });
            }, 'li', this);
        },

        destructor: function () {
            this.clickHandler.detach();
            for(var n in this.nodeInstances){
                this.nodeInstances[n].destroy();
            }
        },
        itemCreator: function (item) {
            var node;
            if(item.imgSrc){
                node = Y.Node.create("<li><img src='" + item.imgSrc + "' alt='" + item.label + "'/></li>");
            } else {
                node = Y.Node.create("<li>" + item.label + "</li>");
            }
            node.nodeName = item.label
            node.addClass(this.getClassName("itemlist", this.get("horizontal") ? "horizontal" : "vertical"));
            return node
        }
    },{
        NAME:"wegas-menu",
        CSS_PREFIX: "wegas-menu",
        ATTRS:{
            horizontal: {
                value: false,
                validator: Y.Lang.isBoolean
            },
            items:{
                validator: function(o){
                    var valid = Y.Lang.isArray(o) || o === null;
                    for(var i in o){
                        valid = Y.Lang.isString(o[i].label) && (Y.Lang.isString(o[i].imgSrc) || o[i].imgSrc == null)
                    }
                    return valid;
                }
            },
            mainItem: {
                value: null,
                validator: Y.Lang.isString
            },
            params:{                                                            // Given input params returned with the click event, a reference for instance
                value: null
            }
        }
    });

    Y.namespace('Wegas').WegasMenu = WegasMenu;
});