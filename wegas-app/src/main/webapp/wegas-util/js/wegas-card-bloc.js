/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Raphaël Schmutz
 */        

YUI.add('wegas-card-bloc', function(Y) {  
    Y.Wegas.CardBloc = Y.Base.create("wegas-card-bloc", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetParent, Y.WidgetChild], { 
        BOUNDING_TEMPLATE: "<div class='card__blocs'></div>",
        CONTENT_TEMPLATE:  null,
        TITLE_TEMPLATE: "<span class='title' />",
        renderUI: function(){
            this.get("boundingBox")
                .addClass("card__blocs--" + this.get("type"));
            (!this._hasTitle()) ? this.get("boundingBox").addClass("card__blocs--untitled") : this.get("boundingBox").append(this.TITLE_TEMPLATE);
        },
        syncUI: function(){
            var context = this;
            (this._hasTitle()) ? this.get("boundingBox").one(".title").setContent(this.get("title")) : null;
            this.get("items").forEach(function(item){
                context.add(new Y.Wegas["CardBloc" + context.get("type").charAt(0).toUpperCase() + context.get("type").slice(1)](item));
            });
        },
        _hasTitle : function(){
            return (this.get("title") !== null);
        }
    },{
        "ATTRS":{
            title: {
                value: null
            },
            type: {},
            items: {
                value: []
            }
        }
    });
    
    Y.Wegas.CardBlocAction = Y.Base.create("wegas-bloc-action", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetChild], { 
        BOUNDING_TEMPLATE: "<a href='#' class='bloc bloc--action bloc--icon'></a>",
        CONTENT_TEMPLATE: null,
        renderUI: function(){
            this.get("boundingBox").addClass("bloc--"+ this.get("icon"));
        },
        bindUI: function(){
            this.get("boundingBox").on("click", function(event){
                event.preventDefault();
                event.stopPropagation();
                this.get("do")();
            }, this);
        },
        syncUI: function(){
            this.get("boundingBox").setAttribute("title", this.get("label"));
            this.get("boundingBox").setContent(this.get("label"));
        }
    },{
        "ATTRS":{
            "label": {},
            "icon" : {}, 
            "do": {}
        }
    });
    
    Y.Wegas.CardBlocMonitoring = Y.Base.create("wegas-bloc-monitoring", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetChild], { 
        BOUNDING_TEMPLATE: "<div class='bloc bloc--monitoring'></div>",
        CONTENT_TEMPLATE: "<span class='bloc__value' />",
        renderUI: function(){
            this.get("boundingBox").prepend(Y.Node.create("<span class='bloc__label' />"));
            this.get("formatter") !== null ? this.get("formatter")(this.get("boundingBox"), this.get("value")) : null;
        },
        syncUI: function(){
            this.get("contentBox").setContent(this.get("value"));
            this.get("boundingBox").one(".bloc__label").setContent(this.get("label"));
        }
    },{
        "ATTRS":{
            "label": {},
            "value" : {}, 
            "formatter": {}
        }
    });
});     
