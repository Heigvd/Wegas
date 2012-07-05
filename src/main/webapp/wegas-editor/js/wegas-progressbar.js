YUI.add('wegas-progressbar', function (Y) {
    'use strict';
    var ProgressBar,
    BOUNDING_BOX = "boundingBox",
    CONTENT_BOX = "contentBox";

    ProgressBar = Y.Base.create("wegas-progressbar", Y.Widget, [], {
        renderUI: function (){
            var bbStyle = this.get(BOUNDING_BOX).getDOMNode().style;
            bbStyle.border = "1px solid " + this.get("color");
            bbStyle.borderRadius = "5px";
            bbStyle.display = "inline-block";
            bbStyle.textAlign = "center";
            bbStyle.fontSize = this.get("height");
        },
        syncUI: function () {
            this.set("percent", this.get("percent"));
            this.set("color", this.get("color"));
        }
    },{
        ATTRS: {
            percent:{
                value:100,
                setter:function (v){
                    this.get(CONTENT_BOX).getDOMNode().style.width = v + "%";
                    if(this.get("showValue")){
                        this.get(CONTENT_BOX).setContent(v + "%");
                    }else{
                        this.get(CONTENT_BOX).setContent("");
                    }
                    return v;
                }
            },
            color:{
                value: "lightblue",
                validator:Y.Lang.isString,
                setter: function(v){
                    this.get(CONTENT_BOX).getDOMNode().style.backgroundColor = v;
                    this.get(BOUNDING_BOX).getDOMNode().style.borderColor = v;
                    return v;
                }
            },
            showValue:{
                value:false,
                validator: Y.Lang.isBoolean,
                setter:function (v){
                    this.set("percent", this.get("percent"));
                    return v;
                }
            }
        }
    });
    Y.namespace("Wegas").ProgressBar = ProgressBar;
});