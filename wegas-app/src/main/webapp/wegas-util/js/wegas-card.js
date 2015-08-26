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
YUI.add('wegas-card', function(Y) {
    Y.Wegas.Card = Y.Base.create("wegas-card", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetParent, Y.WidgetChild], { 
        BOUNDING_TEMPLATE:  "<div class='wrapper wrapper--card' />",
        CONTENT_TEMPLATE:   "<div class='card'></div>",
        renderUI: function(){
            if(this.get("icon") !== null){
                this.get("contentBox")
                    .addClass("card--illustred")
                    .prepend("<div class='card__icon'><i class='fa fa-"+ this.get("icon") +"'></i></div>");
            }            
        },
        syncUI: function(){
            var contentBox = this.get("contentBox");
            this.get("contentBox").append("<div class='card__title'>"+ this.get("title") +"</div>");
            if(this.get("blocs") && this.get("blocs").length > 0){
                this.get("blocs").forEach(function(bloc){
                    contentBox.append(new Y.Wegas.CardBloc(bloc).render().get("boundingBox"));
                });
            }
            
        }
    },{
        'ATTRS':{
            'id':{
                value: null
            },
            'title':{
                value: "Empty card"
            },
            'icon':{
                value: null
            },
            'blocs':{
                value: null
            }
        }
    });
});

