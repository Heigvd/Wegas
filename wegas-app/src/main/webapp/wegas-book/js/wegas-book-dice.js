/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add( "wegas-book-dice", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", Dice;

    Dice = Y.Base.create( "wegas-book-dice", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable ], {
        
        result:0,
        handlers: new Array(),
        rollButton:null,
        isRolling:false,
        
        rollDice: function(when, iteration){
            var cb = this.get(CONTENTBOX), result,
            min = parseInt(this.get("min")), max = parseInt(this.get("max"));
            result = Math.ceil(Math.random()*(max-min+1))+min-1;
            cb.one(".result").setHTML();
            cb.one(".result").append("<p class='result-value-"+result+"'>"+result+"</p>");
            if(this.get("animated").indexOf("true")>-1 && iteration>0){
                Y.later(when, this, Y.bind(this.rollDice, this, when+Math.ceil(when/4), iteration-1));
            }
            else{
                this.result = result;
                this.fire("diceRolled");
                this.isRolling = false;
            }
        },
        
        initializer: function(){
            this.publish("diceRolling", {});
            this.publish("diceRolled", {});
            this.rollButton = new Y.Wegas.Button({
                label:this.get("label"),
                tooltip: this.get("tooltip")
            });
        },
        
        renderUI: function(){
            var cb = this.get(CONTENTBOX);
            cb.append("<div class='wegas-dice'></div>");
            cb.one(".wegas-dice").append("<div class='button'></div>");
            cb.one(".wegas-dice").append("<div class='result'></div>");
            this.rollButton.render(cb.one('.wegas-dice .button'));
        },
        
        bindUI: function(){
            var cb = this.get(CONTENTBOX);
            this.handlers.push(cb.one(".wegas-dice .button").delegate('click', function(){
                if(this.isRolling || this.rollButton.get("disabled")) return;
                this.isRolling = true;
                this.fire("diceRolling");
                this.rollDice(30, 12);
            }, "button", this));
        },
        
        destructor: function(){
            var i;
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
            this.rollButton.destroy();
        }  

    }, {
        ATTRS : {
            min: {
                type: "Integer",
                value: 1
            },
            max: {
                type: "Integer",
                value: 6                
            },
            animated: {
                type : "Boolean",
                value : "false"
            },
            label:{
                type : "String",
                value : "Lancer le dé"
            },
            tooltip:{
                type : "String",
                value : null
            }
        }
    });

    Y.namespace( "Wegas" ).Dice = Dice;
});