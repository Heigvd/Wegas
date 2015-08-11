/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Raphaël Schmutz <raph@hat-owl.cc>
 */        
YUI.add('wegas-cards-resizable', function(Y) {
    Y.Wegas.CardsResizable = Y.Base.create("wegas-cards-resizable", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], { 
        LIMITS: {
            LARGE:0,
            MEDIUM:0,
            SMALL:0
        },
        size: {
            title: 150,
            illustration: 0,
            blocs: {
                monitoring: {
                    cases: 0, large: 0, medium: 0, small: 0
                },
                action: {
                    cases: 0, large: 0, medium: 0, small: 0
                }
            }
        },
        _initValues: function(){
            var context = this, card = context.get("host").get("cardsData")[0], smallTop, smallBottom;
            context.size.illustration = context.get("host").get("contentBox").one(".card").hasClass("card--illustred") ? 80 : 0;
            card.blocs.forEach(function(bloc){
                context.size.blocs[bloc.type].large = context.size.blocs[bloc.type].large + 2;
                context.size.blocs[bloc.type].medium = context.size.blocs[bloc.type].medium + 2;
                context.size.blocs[bloc.type].small = (bloc.type === "action") ? context.size.blocs[bloc.type].small + 2 : context.size.blocs[bloc.type].small;
                bloc.items.forEach(function(){
                    context.size.blocs[bloc.type].cases = context.size.blocs[bloc.type].cases + 1;
                    context.size.blocs[bloc.type].large =  context.size.blocs[bloc.type].large + ((bloc.type === "monitoring")? 80 : 65);
                    context.size.blocs[bloc.type].medium =  context.size.blocs[bloc.type].medium + 65;
                    context.size.blocs[bloc.type].small = context.size.blocs[bloc.type].small + 65;
                });
            });
            smallTop = context.size.illustration + context.size.title + context.size.blocs.action.small;
            smallBottom = context.size.blocs.monitoring.small;
            context.LIMITS.SMALL = (smallTop > smallBottom) ? smallTop : smallBottom; 
            context.LIMITS.MEDIUM = context.size.illustration + context.size.title + context.size.blocs.monitoring.medium + context.size.blocs.action.medium;
            context.LIMITS.LARGE = context.size.illustration + context.size.title + context.size.blocs.monitoring.large + context.size.blocs.action.large;
            context.get("host").get("contentBox").addClass("resizable");            
        },
        _resizeElements: function(size){
            var sizeCharged = 0;
            this.get("host").get("contentBox").all(".card__title").removeAttribute("style");
            this.get("host").get("contentBox").all(".bloc").removeAttribute("style");
            switch(size){
                case "BIG": 
                    sizeCharged = this.size.illustration + this.size.blocs.monitoring.large + this.size.blocs.action.large;
                    break;
                case "LARGE":
                    sizeCharged = this.size.illustration + this.size.blocs.monitoring.medium + this.size.blocs.action.medium;
                    break;
                case "MEDIUM":
                    sizeCharged = this.size.illustration + this.size.blocs.action.medium;
                    this.get("host").get("contentBox").all(".card__blocs--monitoring .bloc").setStyle("width", (100 / this.size.blocs.monitoring.cases) + "%");
                    break;
                case "SMALL":
                    sizeCharged = null;
                    break;
            };
            if(sizeCharged){
                this.get("host").get("contentBox").all(".card__title").setStyle("width", "calc(100% - "+ sizeCharged +"px)");
            }
        },
        _checkResize: function(cardsWidth, limitIndex){
            var context = this,
                limits = ["BIG", "LARGE", "MEDIUM", "SMALL"];
            if(limits[limitIndex]){
                if(limits[limitIndex+1]){
                    if(cardsWidth > context.LIMITS[limits[limitIndex+1]]){
                        if(!context.get("host").get("contentBox").hasClass("resizable--" + limits[limitIndex].toLowerCase())){
                            context.resetClassSize();
                            context.get("host").get("contentBox").addClass("resizable--" + limits[limitIndex].toLowerCase());
                            context._resizeElements(limits[limitIndex]);
                        }
                    }else{
                        limitIndex++; 
                        context._checkResize(cardsWidth, limitIndex);
                    }
                }else{
                    if(!context.get("host").get("contentBox").hasClass("resizable--" + limits[limitIndex].toLowerCase())){
                        context.resetClassSize();
                        context.get("host").get("contentBox").addClass("resizable--" + limits[limitIndex].toLowerCase());
                        context._resizeElements(limits[limitIndex]);
                    }
                }
            }
        },
        _whenResize: function(plugin){
            plugin.resize();
        },
        resetClassSize: function(){
            var context = this, 
                limits = ["BIG", "LARGE", "MEDIUM", "SMALL"];
            limits.forEach(function(limit){
                context.get("host").get("contentBox").removeClass("resizable--" + limit.toLowerCase());
            });
        }, 
        resize: function(){
            var cardsWidth = this.get("host").get("contentBox").one(".card").get("offsetWidth");
            this._checkResize(cardsWidth, 0);
        },
        initializer: function() {                
            var resizeTimer = null,
                context = this;    
            this.afterHostEvent("render", function(event){
                context._initValues();
                Y.Node(window).on("resize", function(){
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(context._whenResize, 250, context);
                });
            });
        }
    });
    Y.Wegas.CardsResizable.NS = "CardsResizable";
});