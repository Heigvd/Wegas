YUI.add( "wegas-teaching-main", function ( Y ) {
    "use strict";
    
    var CONTENTBOX = "contentBox", TeachingMain;
    
    TeachingMain = Y.Base.create("wegas-teaching-main", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        
        graphic: null,
        arrow1: null,
        arrow2: null,
        arrow3: null,
        arrow4: null,
        arrow5: null,
        arrow6: null,
        arrow7: null,
        arrow8: null,
        arrow9: null,
        arrow10: null,
        arrow11: null,
        arrow12: null,
        
        initializer: function(){
            
        },
        
        changeArrow: function(arrow) {
            arrow.changeType();
            //var arrowInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "arrow" + arrow.get("id"));
            //arrowInstance.getInstance().set("value", arrow.get("val"));
            
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                headers: {
                    'Content-Type': 'application/json; charset=ISO-8859-1',
                    'Managed-Mode': 'true'
                },
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\narrow" + arrow.get("id") + ".value=" + arrow.get("val") + ";"
                    })
                }
            });
        },
        
        createArrow: function(x1, x2, y1, y2, id) {
            var arrowInstance = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "arrow" + id);
            var val = arrowInstance.getInstance().get("value");
            var color = this.getColorByVal(val);
            var arrow = this.graphic.addShape({
                type: Y.TeachingArrow,
                stroke: {
                    weight: 4,
                    color: color
                },
                src: [x1, x2],
                tgt: [y1, y2],
                id: id,
                val: val
            });
            
            var handleClick = function(e, parent) {
                parent.changeArrow(arrow);
            };
            
            Y.Node(arrow.get('node')).on('click', handleClick, this, this);
            
            return arrow;
        },
        
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.append("<div id='layer' style='width:100%;height:500px;'></div>");
            
            this.graphic = new Y.Graphic({render: "#layer", autoDraw: true});
            /* Add 12 arrows */
            this.arrow1 = this.createArrow(50, 100, 50, 175, 1);
            this.arrow2 = this.createArrow(200, 100, 200, 175, 2);
            this.arrow3 = this.createArrow(350, 100, 350, 175, 3);
            this.arrow4 = this.createArrow(50, 250, 50, 325, 4);
            this.arrow5 = this.createArrow(200, 250, 200, 325, 5);
            this.arrow6 = this.createArrow(350, 250, 350, 325, 6);
            this.arrow7 = this.createArrow(50, 400, 50, 475, 7);
            this.arrow8 = this.createArrow(200, 400, 200, 475, 8);
            this.arrow9 = this.createArrow(350, 400, 350, 475, 9);
            //this.graphic._redraw();
        },
        
        bindUI: function() {
            /*this.handlers.response = Y.Wegas.Facade.VariableDescriptor.after("update",
                this.syncUI, this);*/
        },
                
        syncUI: function() {
    
        },
                
        destructor: function() {

        },
        
        getColorByVal: function(val) {
            if (val == 0) {
                return 'rgb(200,200,200)';
            }
            else {
                return 'rgb(0,0,0)';
            }
        }
        
    }, {
        ATTRS: {
            
        }
    });
    
    Y.namespace("Wegas").TeachingMain = TeachingMain;
});
