/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add( "wegas-book-dice", function ( Y ) {
    "use strict";

    var CONTENTBOX = "contentBox", Dice;

    Dice = Y.Base.create( "wegas-book-dice", Y.Widget, [ Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable ], {
        
        result:0,
        handlers: new Array(),
        rollButton:null,
        
        initializer: function(){
            this.publish("diceRolled", {});
            this.rollButton = new Y.Wegas.Button({
                label:"Lancer le dé"
            })
        },
        
        renderUI: function(){
            var cb = this.get(CONTENTBOX);
            cb.append("<div class='wegas-dice'></div>");
            cb.one(".wegas-dice").append("<div class='button'></div>");
            cb.one(".wegas-dice").append("<div class='result'></div>");
            this.rollButton.renderUI(cb.one('.wegas-dice .button'));
        },
        
        bindUI: function(){
            var cb = this.get(CONTENTBOX); 
            //this.handlers.push(cb.one("wegas-dice"))
        },
        
        syncUI: function(){
            
        },
        
        destroy: function(){
            
        }
        

    }, {
        ATTRS : {
            min: {
                type: "integer",
                value: 1
            },
            max: {
                type: "integer",
                value: 6                
            }
        }
    });

    Y.namespace( "Wegas" ).Dice = Dice;
});