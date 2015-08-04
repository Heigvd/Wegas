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
    var BLOC_SIZE = 65;
    Y.Wegas.Card = Y.Base.create("wegas-card", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetParent, Y.WidgetChild], { 
        BOUNDING_TEMPLATE:  "<div class='card' />",
        CONTENT_TEMPLATE:   "<div class='card__title'></div>",
        bindUI: function(){
            var blocsSize = 0;
            if(this.get("icon") !== null){
                this.get("boundingBox")
                    .addClass("card--illustred")
                    .prepend("<div class='card__icon'><i class='fa fa-"+ this.get("icon")+"'></i></div>");
            }
            if(this.get("blocs").length > 0){
                this.get("blocs").forEach(function(bloc){
                    blocsSize += 2;
                    bloc.items.forEach(function(){
                        blocsSize += BLOC_SIZE;
                    });
                });
                if(this.get("icon") !== null){
                    blocsSize += 80;
                }
                this.get("contentBox").setStyle("width", "calc(100% - " + blocsSize + "px)");
            }
        },
        syncUI: function(){
            var boundingBox = this.get("boundingBox");
            this.get("contentBox").setContent(this.get("title"));
            if(this.get("blocs") && this.get("blocs").length > 0){
                this.get("blocs").forEach(function(bloc){
                    boundingBox.append(new Y.Wegas.CardBloc(bloc).render().get("contentBox"));
                });
            }
        } 
    },{
        'ATTRS':{
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