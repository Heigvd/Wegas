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
    var BLOC_SIZE = 65;
    Y.Wegas.CardBloc = Y.Base.create("wegas-card-bloc", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetParent, Y.WidgetChild], { 
        CONTENT_TEMPLATE:  "<div class='card__blocs'></div>",
        TITLE_TEMPLATE: "<span class='title' />",
        renderUI: function(){
            this.get("contentBox")
                .addClass("card__blocs--" + this.get("position"))
                .setStyle("width", (this.get("items").length * BLOC_SIZE) + 2);
            (!this._hasTitle()) ? this.get("contentBox").addClass("card__blocs--untitled") : this.get("contentBox").append(this.TITLE_TEMPLATE);
        },
        syncUI: function(){
            var context = this;
            (this._hasTitle()) ? this.get("contentBox").one(".title").setContent(this.get("title")) : null;
            this.get("items").forEach(function(item){
                context.add(new Y.Wegas["CardBloc" + item.type.charAt(0).toUpperCase() + item.type.slice(1)](item));
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
            position:{
                value: "right"
            },
            items: {
                value: []
            }
        }
    });
    
    Y.Wegas.CardBlocAction = Y.Base.create("wegas-bloc-action", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetChild], { 
        CONTENT_TEMPLATE: "<a href='#' class='bloc bloc--icon'></a>",
        renderUI: function(){
            this.get("contentBox").addClass("bloc--"+ this.get("icon"));
        },
        bindUI: function(){
            this.get("contentBox").on("click", function(event){
                event.preventDefault();
                event.stopPropagation();
                this.get("do")();
            }, this);
        },
        syncUI: function(){
            this.get("contentBox").setAttribute("title", this.get("label"));
            this.get("contentBox").setContent(this.get("label"));
        }
    },{
        "ATTRS":{
            "label": {},
            "icon" : {}, 
            "do": {}
        }
    });
    
    Y.Wegas.CardBlocMonitoring = Y.Base.create("wegas-bloc-monitoring", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetChild], { 
        CONTENT_TEMPLATE: "<div class='bloc'></div>"
    },{
        "ATTRS":{
            
        }
    });
});     
