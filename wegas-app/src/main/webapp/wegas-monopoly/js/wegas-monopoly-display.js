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
YUI.add( "wegas-monopoly-display", function ( Y ) {
    "use strict";
    
    var Monopolydisplay;
    
    Monopolydisplay = Y.Base.create( "wegas-monopoly-display", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable ], {
        
        renderUI: function(){
            // dice
            this.dice = this.get("parent").item(0);
            // buy button
            this.buy = this.get("parent").item(1);
            // next button
            this.next = this.get("parent").item(2);
            
            // state
            this.state = Y.Wegas.VariableDescriptorFacade.rest.find("name", "state").getInstance().get("value");
          //  Y.Wegas.VariableDescriptorFacade.rest.find("name", "state").get("scope");
            // Pion
            this.position = Y.Wegas.VariableDescriptorFacade.rest.find("name", "position").getInstance().get("value");
            this.pion1 = Y.Node.create("<div class='pion1 box"+this.position+"'></div>");
            this.get("boundingBox").append(this.pion1);
        },
        
        setPion: function(value){
            this.dice.rollButton.enable();
            
            this.pion1.removeClass("box"+this.position);
            this.position = value + this.position;
            if (this.position > 40){
                this.position -=40;
            }
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
        
        payPlayer: function (){
            // TODO
            // Check if box belong a palyer
            // then: pay and disable buy button 
        },
        
        addPlayer: function (){
            // for each player add a piece
        },
        
        checkState: function (){
            switch (this.state){
                case "roll" :
                    this.buy.disable();
                    this.next.disable();
                    break;
                case "afterRoll" :
                    this.dice.rollButton.disable();
                    this.buy.enable();
                    this.next.enable();
                    break;
                case "wait" :
                    this.dice.rollButton.disable();
                    this.buy.disable();
                    this.next.disable();
            }
        },
        
        setState: function (newState){
            this.state = newState;
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\nstate.value ='"+ this.state +"';"
                    })
                }
            });          
            this.checkState();
        }            
    });
    
    Y.namespace( "Wegas" ).Monopolydisplay = Monopolydisplay;
});