/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-monopoly-controller', function(Y) {
    "use strict";

    /**
     *  @class Monopoly controller
     *  @name Y.Plugin.MonopolyController
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
    MonopolyController = Y.Base.create("wegas-monopoly-controller", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.MonopolyController */

        /**
         * @function
         * @private
         */
        initializer: function() {
            this.afterHostEvent("render", function(){
                this.dice = this.get("host").item(0);
                this.diceAfter();
               
                this.buy = this.get("host").item(1);
                this.boxValue = Y.Wegas.VariableDescriptorFacade.rest.find("name", "boxValue").getAttrs().items;
                this.buyProperty();
               
                this.display = this.get("host").item(5);
                this.display.checkState();
               
                this.restart = this.get("host").item(3);
                this.checkRestart();
                this.clickRestart();
            });
        },
        
        diceAfter: function(){
            this.dice.after("diceRolling",function(){
                this.dice.rollButton.disable();
            }, this);
            this.dice.after("diceRolled", this.setPion, this);
        },
        
        setPion : function(e){
            this.display.setPion(e.target.result);
            this.display.setState("afterRoll");
        },
        
        checkRestart : function(){
            this.restartValue = Y.Wegas.VariableDescriptorFacade.rest.find("name", "restart").getInstance().get("value");
            if (this.restartValue == "true"){
                Y.one('.game .yui3-togglebutton').addClass('yui3-button-selected');
            } else {
                Y.one('.game .yui3-togglebutton').removeClass('yui3-button-selected');
            }
        },
        
        clickRestart : function (e){
            this.restart.on("click", function(){
                // check if all player have true TODO
                
                // change restart status
                if (this.restartValue == "true"){
                    this.restartValue = "false";
                } else {
                    this.restartValue = "true";
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
                            "content": "importPackage(com.wegas.core.script);\nrestart.value ="+ this.restartValue +";"
                        })
                    }
                });
            })
        },
        
        buyProperty: function(){
            this.buy.on("click", function(){
                var position, money;
                // check if property is free TODO
                
                // check if have enough money
                position = Y.Wegas.VariableDescriptorFacade.rest.find("name", "position").getInstance().get("value");
                money = Y.Wegas.VariableDescriptorFacade.rest.find("name", "money").getInstance().get("value");
                position--;
                if (this.boxValue[position].getInstance().get("value") <= money){
                    this.setMoney(money - this.boxValue[position].getInstance().get("value"));
                // add property to the list TODO
                    position++;
                    this.addProperty(position);
                } else {
                    alert("You have not enought money");
                }
            }, this);
            
        },
        
        setMoney: function(value){
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
                        "content": "importPackage(com.wegas.core.script);\nmoney.value ="+ value +";"
                    })
                }
            });
        },
        
        addProperty: function (position){
            var listId;
            listId = Y.Wegas.VariableDescriptorFacade.rest.find("name", "patrimony").getAttrs().id
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: "/" + listId,
                headers:{
                    'Content-Type': 'application/json; charset=ISO-8859-1',
                    'Managed-Mode':'true'
                },
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "id":"",
                        "@class":"NumberDescriptor",
                        "label":"box"+position,
                        "scope":{
                            "@class":"TeamScope"
                        },
                        "defaultInstance":{
                            "@class":"NumberInstance",
                            "id":"",
                            "value":position
                        }
                    })
                }
            });
        }
        
    }, {
        NS: "MonopolyController",
        NAME: "MonopolyController"
    });
    Y.namespace("Plugin").MonopolyController = MonopolyController;

});
