YUI.add( "wegas-teaching-rectangle", function ( Y ) {
    "use strict";
    
    var CONTENTBOX = "contentBox", TeachingRectangle;
    
    TeachingRectangle = Y.Base.create("wegas-teaching-rectangle", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        
        initializer: function(){
        
        },
        
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.append("<div class='rectangle' style='width:" +
                this.get('width') +
                "px;height:" +
                this.get('height') +
                "px;left:" +
                this.get('x') +
                "px;top:" +
                this.get('y') +
                "px;'>" +
                this.get('label') +
                "</div>");
        },
        
        bindUI: function() {
            
        },
                
        syncUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.one('.rectangle').setHTML(this.get('label'));
        },
                
        destructor: function() {

        }
        
    },{
        ATTRS: {
            x: {
                type: "Integer",
                value: 0
            },
            y: {
                type: "Integer",
                value: 0
            },
            width: {
                type: "Integer",
                value: 200
            },
            height: {
                type: "Integer",
                value: 150
            },
            label: {
                type: "String",
                value: "Rectangle"
            },
            id: {
                type: "Integer",
                value: 0
            }
        }
    });
    
    Y.namespace("Wegas").TeachingRectangle = TeachingRectangle;
});
