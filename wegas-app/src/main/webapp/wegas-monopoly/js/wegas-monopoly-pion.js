/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Yannick Lagger lagger.yannick@gmail.com
 */
YUI.add( "wegas-monopoly-pion", function ( Y ) {
    "use strict";
    
    var CONTENTBOX = "contentBox", Pion;
    
    Pion = Y.Base.create( "wegas-monopoly-pion", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable ], {
        
        dice:null,
        
        setPion:function(e){
            this.dice.rollButton.enable();
            var diceValue = e.target.result;
            
//            this.setState(this.state);
            this.pion1.removeClass("box"+this.position);
            this.position = diceValue + this.position;
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                headers:{
                    'Content-Type': 'application/json; charset=ISO-8859-1',
                    'Managed-Mode':'true'
                },
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\nposition.value ="+ this.position +";"
                    })
                }
            });

            this.pion1.addClass("box"+this.position);
        },
        
        initializer: function(){
            // Dice
            this.dice = new Y.Wegas.Dice({
                label:"Roll",
                animated:"true"
            });
            
            // Buy
            this.buy = new Y.Wegas.Button({
                label: "Buy",
                cssClass: "buy"
            });
            
            // Next
            this.next = new Y.Wegas.Button({
                label: "Next",
                cssClass: "next"
            });
            
            // State
            this.state = Y.Wegas.VariableDescriptorFacade.rest.find("name", "state").getInstance().get("value");
            
            // Retrieve all box value
        },
        
        renderUI: function(){
            var cb = this.get(CONTENTBOX);
            
            // Dice
            this.dice.render(cb);
            
            // Pion
            this.position = Y.Wegas.VariableDescriptorFacade.rest.find("name", "position").getInstance().get("value");
            this.pion1 = Y.Node.create("<div class='pion1 box"+this.position+"'></div>");
            this.get("parent").get("parent").get(CONTENTBOX).append(this.pion1);
            
            // State
//            this.getState();
            
            // Buy
            this.buy.render(cb);
            
            // Next
            this.next.render(cb);
        },
        
        bindUI: function(){
            this.dice.after("diceRolling",function(){
                this.dice.rollButton.disable();
            }, this);
            this.dice.after("diceRolled", this.setPion, this);
        },
        
        syncUI: function(){
            var cb = this.get(CONTENTBOX);
            this.dice.render(cb.one(".dice"));
        },
        
        destructor: function(){
            if(this.dice)this.dice.destroy();
            if(this.position)this.position.destroy();
        },
        
        getState: function(){
            switch (this.state){
                case "roll" :
                    this.buy.disable();
                    this.next.disable();
                    break;
                case "buy" :
                    this.dice.rollButton.disable();
                    this.buy.enable();
                    this.next.enable();
                    break;
            } 
        }
        
//        setState: function(state){
//            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
//                request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
//                headers:{
//                    'Content-Type': 'application/json; charset=ISO-8859-1',
//                    'Managed-Mode':'true'
//                },
//                cfg: {
//                    method: "POST",
//                    data: Y.JSON.stringify({
//                        "@class": "Script",
//                        "language": "JavaScript",
//                        "content": "importPackage(com.wegas.core.script);\nstate.value ="+ state +";"
//                    })
//                }
//            });
//        }
    
    }, {
        ATTRS : {
            postion : {
                type: "Integer",
                value: 1
            }
        }
    });
    
    Y.namespace( "Wegas" ).Pion = Pion;
});